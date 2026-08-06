import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router, UrlTree } from '@angular/router';

import { AUTH_RETURN_URL_QUERY_PARAM, AuthRedirectService } from './auth-redirect.service';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (_route, state) => canAccessProtectedRoute(state.url);
export const authChildGuard: CanActivateChildFn = (_route, state) =>
  canAccessProtectedRoute(state.url);

function canAccessProtectedRoute(url: string): true | UrlTree {
  const authService = inject(AuthService);
  const authRedirectService = inject(AuthRedirectService);
  const router = inject(Router);

  if (authService.canAccessProtectedRoutes()) {
    return true;
  }

  authRedirectService.rememberUrl(url);

  return router.createUrlTree(['/login'], {
    queryParams: { [AUTH_RETURN_URL_QUERY_PARAM]: url },
  });
}
