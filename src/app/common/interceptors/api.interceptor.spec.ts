import { HttpErrorResponse, HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { defer, firstValueFrom, of, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ToastService } from '../../ui/toast/toast.service';
import { SKIP_AUTH_REFRESH } from '../api';
import type { AuthenticationSessionUserDto } from '../api/authentication';
import { AuthService } from '../authentication';
import { AppLoaderService } from '../loader/app-loader.service';
import { TenantStore } from '../tenancy';
import { apiInterceptor } from './api.interceptor';

const SESSION_USER: AuthenticationSessionUserDto = {
  id: 'user-1',
  name: 'Session user',
  email: 'user@example.com',
  role: 'TENANT_USER',
  status: 'active',
  tenants: [{ id: 'tenant-2', name: 'Tenant 2', role: 'USER' }],
};

describe('apiInterceptor', () => {
  const refreshSession = vi.fn<AuthService['refreshSession']>();
  const requireLogin = vi.fn<AuthService['requireLogin']>();
  const requirePinLogin = vi.fn<AuthService['requirePinLogin']>();
  const translate = vi.fn<(key: string) => string>();
  const showErrorToast = vi.fn<(message: string) => void>();
  let selectedTenantId: string | null;

  beforeEach(() => {
    selectedTenantId = 'tenant-1';
    refreshSession.mockReset();
    requireLogin.mockReset();
    requirePinLogin.mockReset();
    translate.mockReset();
    translate.mockImplementation((key) => key);
    showErrorToast.mockReset();

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { refreshSession, requireLogin, requirePinLogin } },
        { provide: Router, useValue: { navigateByUrl: vi.fn() } },
        { provide: TranslocoService, useValue: { translate } },
        { provide: ToastService, useValue: { error: showErrorToast } },
        { provide: AppLoaderService, useValue: { show: vi.fn(), hide: vi.fn() } },
        {
          provide: TenantStore,
          useValue: {
            selectedTenant: () => (selectedTenantId === null ? null : { id: selectedTenantId }),
          },
        },
      ],
    });
  });

  it.each([
    ['GET', '/customers'],
    ['POST', '/customers'],
    ['GET', '/customers/customer-1'],
    ['PATCH', '/customers/customer-1'],
    ['POST', '/devices'],
    ['GET', '/devices/device-1'],
    ['PATCH', '/devices/device-1'],
    ['GET', '/service-orders'],
  ] as const)('adds x-tenant-id to %s %s requests', async (method, path) => {
    const request = await interceptRequest(`${environment.api.baseUrl}${path}`, method);

    expect(request.headers.get('x-tenant-id')).toBe('tenant-1');
  });

  it('does not add x-tenant-id to external requests', async () => {
    const request = await interceptRequest('https://example.com/customers');

    expect(request.headers.has('x-tenant-id')).toBe(false);
  });

  it('does not add x-tenant-id to non-tenant API requests', async () => {
    const request = await interceptRequest(`${environment.api.baseUrl}/authentication/session`);

    expect(request.headers.has('x-tenant-id')).toBe(false);
  });

  it('does not send a tenant-scoped request before a tenant is selected', async () => {
    selectedTenantId = null;
    const next = vi.fn<HttpHandlerFn>(() => of(new HttpResponse({ status: 200 })));
    const response = TestBed.runInInjectionContext(() =>
      apiInterceptor(new HttpRequest('GET', `${environment.api.baseUrl}/customers`), next),
    );

    await expect(firstValueFrom(response)).rejects.toMatchObject({
      code: 'TENANT_NOT_SELECTED',
    });

    expect(next).not.toHaveBeenCalled();
    expect(translate).toHaveBeenCalledWith('api.errors.tenantNotSelected');
    expect(showErrorToast).toHaveBeenCalledWith('api.errors.tenantNotSelected');
  });

  it('refreshes the session and retries an unauthorized request with the restored tenant', async () => {
    const interceptedRequests: HttpRequest<unknown>[] = [];
    refreshSession.mockImplementation(() =>
      defer(() => {
        selectedTenantId = 'tenant-2';

        return of(SESSION_USER);
      }),
    );
    const next: HttpHandlerFn = (request) => {
      interceptedRequests.push(request);

      if (interceptedRequests.length === 1) {
        return throwError(() => new HttpErrorResponse({ status: 401 }));
      }

      return of(new HttpResponse({ status: 200 }));
    };

    await firstValueFrom(
      TestBed.runInInjectionContext(() =>
        apiInterceptor(new HttpRequest('GET', `${environment.api.baseUrl}/customers`), next),
      ),
    );

    expect(refreshSession).toHaveBeenCalledOnce();
    expect(interceptedRequests).toHaveLength(2);
    expect(interceptedRequests[0]?.headers.get('x-tenant-id')).toBe('tenant-1');
    expect(interceptedRequests[1]?.headers.get('x-tenant-id')).toBe('tenant-2');
    expect(interceptedRequests[1]?.context.get(SKIP_AUTH_REFRESH)).toBe(true);
  });

  it('does not retry the request when restoring the session fails', async () => {
    const sessionError = new Error('Session could not be restored');
    const next = vi.fn<HttpHandlerFn>(() =>
      throwError(() => new HttpErrorResponse({ status: 401 })),
    );
    refreshSession.mockReturnValue(throwError(() => sessionError));
    const response = TestBed.runInInjectionContext(() =>
      apiInterceptor(new HttpRequest('GET', `${environment.api.baseUrl}/customers`), next),
    );

    await expect(firstValueFrom(response)).rejects.toMatchObject({ status: 401 });

    expect(refreshSession).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledOnce();
  });

  it('redirects to login when refreshing the session returns 401', async () => {
    const next = vi.fn<HttpHandlerFn>(() =>
      throwError(() => new HttpErrorResponse({ status: 401 })),
    );
    refreshSession.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            error: {
              success: false,
              error: {
                code: 'INVALID_REFRESH_TOKEN',
                message: 'Refresh token is invalid.',
              },
            },
          }),
      ),
    );
    const response = TestBed.runInInjectionContext(() =>
      apiInterceptor(new HttpRequest('GET', `${environment.api.baseUrl}/customers`), next),
    );

    await expect(firstValueFrom(response)).rejects.toMatchObject({
      status: 401,
      code: 'INVALID_REFRESH_TOKEN',
    });

    expect(requireLogin).toHaveBeenCalledOnce();
    expect(requirePinLogin).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledOnce();
  });

  it('redirects to PIN login when refreshing the session requires a PIN', async () => {
    const next = vi.fn<HttpHandlerFn>(() =>
      throwError(() => new HttpErrorResponse({ status: 401 })),
    );
    refreshSession.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 423,
            error: {
              success: false,
              error: {
                code: 'PIN_REQUIRED',
                message: 'PIN login is required.',
                details: { redirectTo: '/pin-login' },
              },
            },
          }),
      ),
    );
    const response = TestBed.runInInjectionContext(() =>
      apiInterceptor(new HttpRequest('GET', `${environment.api.baseUrl}/devices/device-1`), next),
    );

    await expect(firstValueFrom(response)).rejects.toMatchObject({
      status: 423,
      code: 'PIN_REQUIRED',
    });

    expect(requirePinLogin).toHaveBeenCalledOnce();
    expect(requireLogin).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledOnce();
  });

  it('does not retry a tenant-scoped request when the restored session has no tenant', async () => {
    const next = vi.fn<HttpHandlerFn>(() =>
      throwError(() => new HttpErrorResponse({ status: 401 })),
    );
    refreshSession.mockImplementation(() =>
      defer(() => {
        selectedTenantId = null;

        return of(SESSION_USER);
      }),
    );
    const response = TestBed.runInInjectionContext(() =>
      apiInterceptor(new HttpRequest('GET', `${environment.api.baseUrl}/devices/device-1`), next),
    );

    await expect(firstValueFrom(response)).rejects.toMatchObject({
      code: 'TENANT_NOT_SELECTED',
    });

    expect(refreshSession).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledOnce();
  });
});

async function interceptRequest(url: string, method = 'GET'): Promise<HttpRequest<unknown>> {
  const interceptedRequest: { value: HttpRequest<unknown> | null } = { value: null };
  const next: HttpHandlerFn = (request) => {
    interceptedRequest.value = request;

    return of(new HttpResponse({ status: 200 }));
  };
  const response = TestBed.runInInjectionContext(() =>
    apiInterceptor(new HttpRequest(method, url, null), next),
  );

  await firstValueFrom(response);

  if (interceptedRequest.value === null) {
    throw new Error('The request did not reach the next HTTP handler.');
  }

  return interceptedRequest.value;
}
