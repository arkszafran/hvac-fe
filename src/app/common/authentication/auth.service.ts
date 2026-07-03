import { HttpContext } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, switchMap, tap, throwError } from 'rxjs';

import {
  SKIP_AUTH_REFRESH,
  SKIP_ERROR_TOAST,
  SKIP_GLOBAL_LOADER,
  type ApiRequestOptions,
} from '../api';
import {
  AuthenticationApi,
  type AuthenticationSessionUserDto,
  type AuthenticationSessionUserStatus,
  type LoginDto,
} from '../api/authentication';
import { environment } from '../../../environments/environment';

const NEW_USER_SETUP_PATH = 'setup-new-credentails';
const BLOCKED_USER_PATH = 'user-blocked';

interface SessionHandlingOptions {
  shouldRedirect: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authenticationApi = inject(AuthenticationApi);
  private readonly router = inject(Router);
  private readonly sessionUser = signal<AuthenticationSessionUserDto | null>(null);

  readonly user = this.sessionUser.asReadonly();
  readonly isAuthenticated = computed(() => this.user() !== null);
  readonly canAccessProtectedRoutes = computed(() => {
    const user = this.user();

    return user !== null && user.status !== 'new';
  });

  initialize(): Observable<void> {
    return this.refreshSession({ shouldRedirect: true }).pipe(
      map(() => undefined),
      catchError(() => of(undefined)),
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

  refreshSession(
    options: SessionHandlingOptions = { shouldRedirect: false },
  ): Observable<AuthenticationSessionUserDto> {
    return this.authenticationApi.refresh({ context: createSilentAuthContext() }).pipe(
      map((response) => response.data),
      tap((user) => this.handleAuthenticatedUser(user, options)),
      catchError((error: unknown) => {
        this.clearSession();

        return throwError(() => error);
      }),
    );
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
    this.sessionUser.set(user);

    if (!options.shouldRedirect) {
      return;
    }

    this.redirectByUserStatus(user.status);
  }

  private clearSession(): void {
    this.sessionUser.set(null);
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
        this.navigateTo(environment.auth.activeUserRedirectPath);
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
