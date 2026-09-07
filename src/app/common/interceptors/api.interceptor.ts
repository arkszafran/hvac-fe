import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { Observable, catchError, finalize, switchMap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from '../authentication';
import { ApiError } from '../api/api-error.model';
import { mapApiError } from '../api/api-error.mapper';
import {
  SKIP_AUTH_REFRESH,
  SKIP_API_REDIRECT,
  SKIP_ERROR_TOAST,
  SKIP_GLOBAL_LOADER,
} from '../api/api-context.tokens';
import { AppLoaderService } from '../loader/app-loader.service';
import { TenantStore } from '../tenancy';
import { ToastService } from '../../ui/toast/toast.service';

const ACCOUNT_BLOCKED_ERROR_CODES = new Set(['LOGIN_RETRIES_LIMIT_REACHED', 'ACCOUNT_BLOCKED']);
const ACCOUNT_BLOCKED_ROUTE = '/account-blocked';
const PIN_REQUIRED_ERROR_CODE = 'PIN_REQUIRED';
const TENANT_REQUIRED_PATH_PREFIXES = ['/customers', '/devices', '/service-orders'] as const;
const TENANT_NOT_SELECTED_ERROR_CODE = 'TENANT_NOT_SELECTED';

export const apiInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const tenantStore = inject(TenantStore);
  const loader = inject(AppLoaderService);
  const router = inject(Router);
  const toast = inject(ToastService);
  const transloco = inject(TranslocoService);
  const tenantId = normalizeTenantId(tenantStore.selectedTenant()?.id);

  if (isTenantRequired(request.url) && tenantId === null) {
    return handleApiError(
      createTenantNotSelectedError(request.url),
      request,
      router,
      toast,
      authService,
      transloco,
    );
  }

  const requestWithTenant = addTenantHeader(request, tenantId);
  const shouldShowLoader = !requestWithTenant.context.get(SKIP_GLOBAL_LOADER);

  if (shouldShowLoader) {
    loader.show();
  }

  return next(requestWithTenant).pipe(
    catchError((error: unknown) => {
      const apiError = mapApiError(error);

      if (isImmediateAuthRedirectError(apiError)) {
        return handleApiError(apiError, requestWithTenant, router, toast, authService, transloco);
      }

      if (
        readRedirectTo(apiError.details) !== null &&
        !requestWithTenant.context.get(SKIP_API_REDIRECT)
      ) {
        return handleApiError(apiError, requestWithTenant, router, toast, authService, transloco);
      }

      if (!shouldRefreshSession(requestWithTenant, apiError)) {
        return handleApiError(apiError, requestWithTenant, router, toast, authService, transloco);
      }

      return authService.refreshSession().pipe(
        catchError((refreshError: unknown) => {
          const refreshApiError = mapApiError(refreshError);

          if (isImmediateAuthRedirectError(refreshApiError)) {
            return handleApiError(
              refreshApiError,
              requestWithTenant,
              router,
              toast,
              authService,
              transloco,
            );
          }

          if (refreshApiError.status === 401) {
            authService.requireLogin();

            return throwError(() => refreshApiError);
          }

          return handleApiError(apiError, requestWithTenant, router, toast, authService, transloco);
        }),
        switchMap(() => {
          const refreshedTenantId = normalizeTenantId(tenantStore.selectedTenant()?.id);

          if (isTenantRequired(requestWithTenant.url) && refreshedTenantId === null) {
            return handleApiError(
              createTenantNotSelectedError(requestWithTenant.url),
              requestWithTenant,
              router,
              toast,
              authService,
              transloco,
            );
          }

          return next(
            addTenantHeader(markRequestAsAuthRetried(requestWithTenant), refreshedTenantId),
          ).pipe(
            catchError((retryError: unknown) =>
              handleApiError(
                mapApiError(retryError),
                requestWithTenant,
                router,
                toast,
                authService,
                transloco,
              ),
            ),
          );
        }),
      );
    }),
    finalize(() => {
      if (shouldShowLoader) {
        loader.hide();
      }
    }),
  );
};

function addTenantHeader<T>(request: HttpRequest<T>, tenantId: string | null): HttpRequest<T> {
  if (tenantId === null || !isTenantRequired(request.url)) {
    return request;
  }

  return request.clone({
    setHeaders: {
      'x-tenant-id': tenantId,
    },
  });
}

function isTenantRequired(url: string): boolean {
  const endpointPath = readApiEndpointPath(url);

  return (
    endpointPath !== null &&
    TENANT_REQUIRED_PATH_PREFIXES.some((pathPrefix) => matchesPathPrefix(endpointPath, pathPrefix))
  );
}

function normalizeTenantId(tenantId: string | undefined): string | null {
  const normalizedTenantId = tenantId?.trim();

  return normalizedTenantId ? normalizedTenantId : null;
}

function createTenantNotSelectedError(url: string): ApiError {
  return {
    status: 0,
    code: TENANT_NOT_SELECTED_ERROR_CODE,
    message: '',
    messageKey: 'api.errors.tenantNotSelected',
    url,
  };
}

function isAccountBlockedError(apiError: ApiError): boolean {
  return ACCOUNT_BLOCKED_ERROR_CODES.has(apiError.code);
}

function isPinRequiredError(apiError: ApiError): boolean {
  return apiError.code === PIN_REQUIRED_ERROR_CODE;
}

function isImmediateAuthRedirectError(apiError: ApiError): boolean {
  return isAccountBlockedError(apiError) || isPinRequiredError(apiError);
}

function handleApiError(
  apiError: ApiError,
  request: HttpRequest<unknown>,
  router: Router,
  toast: ToastService,
  authService: AuthService,
  transloco: TranslocoService,
): Observable<never> {
  if (isAccountBlockedError(apiError)) {
    void router.navigateByUrl(ACCOUNT_BLOCKED_ROUTE);

    return throwError(() => apiError);
  }

  if (isPinRequiredError(apiError)) {
    authService.requirePinLogin();

    return throwError(() => apiError);
  }

  const redirectTo = readRedirectTo(apiError.details);

  if (redirectTo !== null && !request.context.get(SKIP_API_REDIRECT)) {
    void router.navigateByUrl(toAbsoluteRoutePath(redirectTo));
  }

  if (!request.context.get(SKIP_ERROR_TOAST)) {
    toast.error(
      apiError.message || transloco.translate(apiError.messageKey ?? 'api.errors.unknown'),
    );
  }

  return throwError(() => apiError);
}

function shouldRefreshSession(request: HttpRequest<unknown>, apiError: ApiError): boolean {
  return (
    apiError.status === 401 &&
    !request.context.get(SKIP_AUTH_REFRESH) &&
    !isAuthRefreshExcludedPath(request.url)
  );
}

function markRequestAsAuthRetried(request: HttpRequest<unknown>): HttpRequest<unknown> {
  return request.clone({
    context: request.context.set(SKIP_AUTH_REFRESH, true),
  });
}

function isAuthRefreshExcludedPath(url: string): boolean {
  const endpointPath = readApiEndpointPath(url);

  if (endpointPath === null) {
    return true;
  }

  return environment.api.authRefreshExcludedPathPrefixes.some((pathPrefix) =>
    matchesPathPrefix(endpointPath, pathPrefix),
  );
}

function readApiEndpointPath(url: string): string | null {
  try {
    const apiBaseUrl = new URL(environment.api.baseUrl);
    const requestUrl = new URL(url, apiBaseUrl);

    if (requestUrl.origin !== apiBaseUrl.origin) {
      return null;
    }

    const apiBasePath = normalizePath(apiBaseUrl.pathname);
    const requestPath = normalizePath(requestUrl.pathname);

    if (apiBasePath === '/') {
      return requestPath;
    }

    if (requestPath === apiBasePath) {
      return '/';
    }

    if (requestPath.startsWith(`${apiBasePath}/`)) {
      return normalizePath(requestPath.slice(apiBasePath.length));
    }

    return null;
  } catch {
    return null;
  }
}

function matchesPathPrefix(path: string, pathPrefix: string): boolean {
  const normalizedPath = normalizePath(path);
  const normalizedPathPrefix = normalizePath(pathPrefix);

  return (
    normalizedPath === normalizedPathPrefix || normalizedPath.startsWith(`${normalizedPathPrefix}/`)
  );
}

function readRedirectTo(details: unknown): string | null {
  if (!isRecord(details)) {
    return null;
  }

  const redirectTo = details['redirectTo'];

  return typeof redirectTo === 'string' && redirectTo.trim() ? redirectTo : null;
}

function normalizePath(path: string): string {
  const trimmedPath = path.trim();

  if (!trimmedPath || trimmedPath === '/') {
    return '/';
  }

  return `/${trimmedPath.replace(/^\/+|\/+$/g, '')}`;
}

function toAbsoluteRoutePath(path: string): string {
  const normalizedPath = path.trim();

  if (!normalizedPath) {
    return '/';
  }

  return normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
