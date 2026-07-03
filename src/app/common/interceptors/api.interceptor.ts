import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, switchMap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from '../authentication';
import { ApiError } from '../api/api-error.model';
import { mapApiError } from '../api/api-error.mapper';
import {
  SKIP_AUTH_REFRESH,
  SKIP_ERROR_TOAST,
  SKIP_GLOBAL_LOADER,
} from '../api/api-context.tokens';
import { AppLoaderService } from '../loader/app-loader.service';
import { ToastService } from '../../ui/toast/toast.service';

export const apiInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const loader = inject(AppLoaderService);
  const router = inject(Router);
  const toast = inject(ToastService);
  const shouldShowLoader = !request.context.get(SKIP_GLOBAL_LOADER);

  if (shouldShowLoader) {
    loader.show();
  }

  return next(request).pipe(
    catchError((error: unknown) => {
      const apiError = mapApiError(error);

      if (readRedirectTo(apiError.details) !== null) {
        return handleApiError(apiError, request, router, toast);
      }

      if (!shouldRefreshSession(request, apiError)) {
        return handleApiError(apiError, request, router, toast);
      }

      return authService.refreshSession().pipe(
        catchError(() => handleApiError(apiError, request, router, toast)),
        switchMap(() =>
          next(markRequestAsAuthRetried(request)).pipe(
            catchError((retryError: unknown) =>
              handleApiError(mapApiError(retryError), request, router, toast),
            ),
          ),
        ),
      );
    }),
    finalize(() => {
      if (shouldShowLoader) {
        loader.hide();
      }
    }),
  );
};

function handleApiError(
  apiError: ApiError,
  request: HttpRequest<unknown>,
  router: Router,
  toast: ToastService,
): Observable<never> {
  const redirectTo = readRedirectTo(apiError.details);

  if (redirectTo !== null) {
    void router.navigateByUrl(toAbsoluteRoutePath(redirectTo));
  }

  if (!request.context.get(SKIP_ERROR_TOAST)) {
    toast.error(apiError.message);
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
    normalizedPath === normalizedPathPrefix ||
    normalizedPath.startsWith(`${normalizedPathPrefix}/`)
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
