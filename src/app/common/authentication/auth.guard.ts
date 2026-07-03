import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router, UrlTree } from '@angular/router';

import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => canAccessProtectedRoute();
export const authChildGuard: CanActivateChildFn = () => canAccessProtectedRoute();

function canAccessProtectedRoute(): true | UrlTree {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.canAccessProtectedRoutes()) {
    return true;
  }

  return router.createUrlTree(['/login']);
}
