import { HttpContext } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  Observable,
  catchError,
  finalize,
  map,
  of,
  shareReplay,
  switchMap,
  tap,
  throwError,
} from 'rxjs';

import {
  SKIP_AUTH_REFRESH,
  SKIP_API_REDIRECT,
  SKIP_ERROR_TOAST,
  SKIP_GLOBAL_LOADER,
  type ApiRequestOptions,
} from '../api';
import {
  AuthenticationApi,
  type AuthenticationSessionUserDto,
  type AuthenticationSessionUserStatus,
  type LoginDto,
  type PinLoginDto,
} from '../api/authentication';
import { environment } from '../../../environments/environment';
import { TenantStore } from '../tenancy';
import { AuthRedirectService } from './auth-redirect.service';

const NEW_USER_SETUP_PATH = 'setup-new-credentails';
const BLOCKED_USER_PATH = 'account-blocked';
const PIN_LOGIN_PATH = 'pin-login';
const LOGIN_PATH = 'login';

interface SessionHandlingOptions {
  shouldRedirect: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authenticationApi = inject(AuthenticationApi);
  private readonly authRedirectService = inject(AuthRedirectService);
  private readonly tenantStore = inject(TenantStore);
  private readonly router = inject(Router);
  private readonly sessionUser = signal<AuthenticationSessionUserDto | null>(null);
  private readonly initialCredentialsPassword = signal<string | null>(null);
  private refreshSessionRequest: Observable<AuthenticationSessionUserDto> | null = null;

  readonly user = this.sessionUser.asReadonly();
  readonly currentInitialCredentialsPassword = this.initialCredentialsPassword.asReadonly();
  readonly isAuthenticated = computed(() => this.user() !== null);
  readonly canAccessProtectedRoutes = computed(() => {
    const user = this.user();

    return user !== null && user.status !== 'new';
  });

  initialize(): Observable<void> {
    this.authRedirectService.rememberCurrentUrl();

    return this.authenticationApi.refresh({ context: createSilentAuthContext() }).pipe(
      switchMap(() =>
        this.loadSession(
          { shouldRedirect: true },
          {
            context: createSilentAuthContext(),
          },
        ),
      ),
      map(() => undefined),
      catchError(() => {
        this.clearSession();

        return of(undefined);
      }),
    );
  }

  login(body: LoginDto, options?: ApiRequestOptions): Observable<AuthenticationSessionUserDto> {
    return this.authenticationApi.login(body, options).pipe(
      switchMap(() => this.loadSession({ shouldRedirect: true }, options)),
      catchError((error: unknown) => {
        this.clearSession();

        return throwError(() => error);
      }),
    );
  }

  autoLoginWithInitialCredentials(
    body: LoginDto,
    options?: ApiRequestOptions,
  ): Observable<AuthenticationSessionUserDto> {
    this.initialCredentialsPassword.set(body.password);

    return this.login(body, options).pipe(
      catchError((error: unknown) => {
        this.initialCredentialsPassword.set(null);

        return throwError(() => error);
      }),
    );
  }

  pinLogin(
    body: PinLoginDto,
    options?: ApiRequestOptions,
  ): Observable<AuthenticationSessionUserDto> {
    return this.authenticationApi.pinLogin(body, options).pipe(
      switchMap(() => this.loadSession({ shouldRedirect: true }, options)),
      catchError((error: unknown) => {
        this.clearSession();

        return throwError(() => error);
      }),
    );
  }

  completeInitialCredentialsSetup(): Observable<AuthenticationSessionUserDto> {
    this.initialCredentialsPassword.set(null);

    return this.loadSession(
      { shouldRedirect: true },
      {
        context: createSilentAuthContext(),
      },
    );
  }

  logout(options?: ApiRequestOptions): Observable<void> {
    this.clearSession();
    this.authRedirectService.clear();

    return this.authenticationApi.logout(options ?? { context: createSilentAuthContext() }).pipe(
      catchError(() => of(null)),
      tap(() => this.navigateTo(LOGIN_PATH)),
      map(() => undefined),
    );
  }

  refreshSession(
    options: SessionHandlingOptions = { shouldRedirect: false },
  ): Observable<AuthenticationSessionUserDto> {
    if (this.refreshSessionRequest !== null) {
      return this.refreshSessionRequest;
    }

    this.refreshSessionRequest = this.authenticationApi
      .refresh({ context: createSilentAuthContext() })
      .pipe(
        switchMap(() =>
          this.loadSession(options, {
            context: createSilentAuthContext(),
          }),
        ),
        catchError((error: unknown) => {
          this.clearSession();

          return throwError(() => error);
        }),
        finalize(() => {
          this.refreshSessionRequest = null;
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    return this.refreshSessionRequest;
  }

  requirePinLogin(): void {
    this.authRedirectService.rememberUrl(this.router.url);
    this.clearSession();
    this.navigateTo(PIN_LOGIN_PATH);
  }

  requireLogin(): void {
    this.authRedirectService.rememberUrl(this.router.url);
    this.clearSession();
    this.navigateTo(LOGIN_PATH);
  }

  private loadSession(
    handlingOptions: SessionHandlingOptions,
    requestOptions?: ApiRequestOptions,
  ): Observable<AuthenticationSessionUserDto> {
    return this.authenticationApi.session(requestOptions).pipe(
      map((response) => response.data),
      tap((user) => this.handleAuthenticatedUser(user, handlingOptions)),
    );
  }

  private handleAuthenticatedUser(
    user: AuthenticationSessionUserDto,
    options: SessionHandlingOptions,
  ): void {
    this.tenantStore.initializeForUser(user);
    this.sessionUser.set(user);

    if (!options.shouldRedirect) {
      return;
    }

    this.redirectByUserStatus(user.status);
  }

  private clearSession(): void {
    this.tenantStore.clearSession();
    this.sessionUser.set(null);
    this.initialCredentialsPassword.set(null);
  }

  private redirectByUserStatus(status: AuthenticationSessionUserStatus): void {
    switch (status) {
      case 'new':
        this.navigateTo(NEW_USER_SETUP_PATH);
        return;
      case 'blocked':
        this.navigateTo(BLOCKED_USER_PATH);
        return;
      case 'active':
        this.navigateTo(
          this.authRedirectService.consumeUrl(environment.auth.activeUserRedirectPath),
        );
        return;
      default:
        assertNever(status);
    }
  }

  private navigateTo(path: string): void {
    void this.router.navigateByUrl(toAbsoluteRoutePath(path));
  }
}

function createSilentAuthContext(): HttpContext {
  return new HttpContext()
    .set(SKIP_AUTH_REFRESH, true)
    .set(SKIP_API_REDIRECT, true)
    .set(SKIP_ERROR_TOAST, true)
    .set(SKIP_GLOBAL_LOADER, true);
}

function toAbsoluteRoutePath(path: string): string {
  const normalizedPath = path.trim();

  if (!normalizedPath) {
    return '/';
  }

  return normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
}

function assertNever(value: never): never {
  throw new Error(`Unsupported authentication user status: ${String(value)}`);
}
