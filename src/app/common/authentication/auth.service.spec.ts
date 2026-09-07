import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Subject, defer, firstValueFrom, of, throwError } from 'rxjs';

import { SKIP_AUTH_REFRESH, SKIP_GLOBAL_LOADER } from '../api';
import {
  AuthenticationApi,
  type AuthenticationRefreshResponseDto,
  type AuthenticationSessionResponseDto,
  type AuthenticationSessionUserDto,
} from '../api/authentication';
import { TenantStore } from '../tenancy';
import { AuthRedirectService } from './auth-redirect.service';
import { AuthService } from './auth.service';

const REFRESH_USER: AuthenticationSessionUserDto = {
  id: 'user-1',
  name: 'Refresh user',
  email: 'refresh@example.com',
  role: 'TENANT_USER',
  status: 'active',
  tenants: [{ id: 'tenant-old', name: 'Old tenant', role: 'USER' }],
};

const SESSION_USER: AuthenticationSessionUserDto = {
  ...REFRESH_USER,
  name: 'Session user',
  tenants: [{ id: 'tenant-new', name: 'New tenant', role: 'USER' }],
};

const REFRESH_RESPONSE: AuthenticationRefreshResponseDto = {
  success: true,
  data: null,
};

const SESSION_RESPONSE: AuthenticationSessionResponseDto = {
  success: true,
  data: SESSION_USER,
};

describe('AuthService refreshSession', () => {
  const refresh = vi.fn<AuthenticationApi['refresh']>();
  const session = vi.fn<AuthenticationApi['session']>();
  const initializeForUser = vi.fn<TenantStore['initializeForUser']>();
  const clearTenantSession = vi.fn<TenantStore['clearSession']>();
  const rememberUrl = vi.fn<AuthRedirectService['rememberUrl']>();
  const navigateByUrl = vi.fn<Router['navigateByUrl']>();
  let service: AuthService;

  beforeEach(() => {
    refresh.mockReset();
    session.mockReset();
    initializeForUser.mockReset();
    clearTenantSession.mockReset();
    rememberUrl.mockReset();
    navigateByUrl.mockReset();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        {
          provide: AuthenticationApi,
          useValue: { refresh, session },
        },
        {
          provide: AuthRedirectService,
          useValue: {
            rememberCurrentUrl: vi.fn(),
            rememberUrl,
            consumeUrl: vi.fn(),
            clear: vi.fn(),
          },
        },
        {
          provide: TenantStore,
          useValue: {
            initializeForUser,
            clearSession: clearTenantSession,
          },
        },
        {
          provide: Router,
          useValue: {
            url: '/customers/customer-1',
            navigateByUrl,
          },
        },
      ],
    });

    service = TestBed.inject(AuthService);
  });

  it('refreshes the token, loads the current session and initializes its tenant', async () => {
    const callOrder: string[] = [];
    refresh.mockImplementation(() =>
      defer(() => {
        callOrder.push('refresh');

        return of(REFRESH_RESPONSE);
      }),
    );
    session.mockImplementation(() =>
      defer(() => {
        callOrder.push('session');

        return of(SESSION_RESPONSE);
      }),
    );

    const user = await firstValueFrom(service.refreshSession());

    expect(callOrder).toEqual(['refresh', 'session']);
    expect(user).toEqual(SESSION_USER);
    expect(service.user()).toEqual(SESSION_USER);
    expect(initializeForUser).toHaveBeenCalledOnce();
    expect(initializeForUser).toHaveBeenCalledWith(SESSION_USER);
    expect(refresh.mock.calls[0]?.[0]?.context?.get(SKIP_AUTH_REFRESH)).toBe(true);
    expect(session.mock.calls[0]?.[0]?.context?.get(SKIP_AUTH_REFRESH)).toBe(true);
    expect(refresh.mock.calls[0]?.[0]?.context?.get(SKIP_GLOBAL_LOADER)).toBe(true);
    expect(session.mock.calls[0]?.[0]?.context?.get(SKIP_GLOBAL_LOADER)).toBe(true);
  });

  it('shares one refresh and session sequence between concurrent requests', async () => {
    const refreshResponse = new Subject<AuthenticationRefreshResponseDto>();
    refresh.mockReturnValue(refreshResponse);
    session.mockReturnValue(of(SESSION_RESPONSE));

    const firstRefresh = service.refreshSession();
    const secondRefresh = service.refreshSession();
    const firstResult = firstValueFrom(firstRefresh);
    const secondResult = firstValueFrom(secondRefresh);

    refreshResponse.next(REFRESH_RESPONSE);
    refreshResponse.complete();

    await expect(Promise.all([firstResult, secondResult])).resolves.toEqual([
      SESSION_USER,
      SESSION_USER,
    ]);
    expect(firstRefresh).toBe(secondRefresh);
    expect(refresh).toHaveBeenCalledOnce();
    expect(session).toHaveBeenCalledOnce();
    expect(initializeForUser).toHaveBeenCalledOnce();
  });

  it('clears authentication state when loading the session fails', async () => {
    const sessionError = new Error('Session could not be loaded');
    refresh.mockReturnValue(of(REFRESH_RESPONSE));
    session.mockReturnValue(throwError(() => sessionError));

    await expect(firstValueFrom(service.refreshSession())).rejects.toBe(sessionError);

    expect(session).toHaveBeenCalledOnce();
    expect(initializeForUser).not.toHaveBeenCalled();
    expect(clearTenantSession).toHaveBeenCalledOnce();
    expect(service.user()).toBeNull();
  });

  it('preserves the current URL and redirects to login when login is required', () => {
    service.requireLogin();

    expect(rememberUrl).toHaveBeenCalledWith('/customers/customer-1');
    expect(clearTenantSession).toHaveBeenCalledOnce();
    expect(navigateByUrl).toHaveBeenCalledWith('/login');
  });
});
