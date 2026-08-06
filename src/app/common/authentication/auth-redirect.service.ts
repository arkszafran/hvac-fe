import { Location } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { PRIMARY_OUTLET, Router, type UrlTree } from '@angular/router';

export const AUTH_RETURN_URL_QUERY_PARAM = 'returnUrl';

const AUTHENTICATION_PATHS = new Set([
  'account-blocked',
  'account-unlock',
  'auto-login',
  'login',
  'password-reset',
  'pin-login',
  'request-password-reset',
  'setup-new-credentails',
]);

@Injectable({ providedIn: 'root' })
export class AuthRedirectService {
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private redirectUrl: string | null = null;

  rememberCurrentUrl(): void {
    const currentUrl = toAbsoluteRoutePath(this.location.path(true));

    if (this.isAllowedRedirectUrl(currentUrl)) {
      this.redirectUrl = currentUrl;
      return;
    }

    const returnUrl = this.readReturnUrl(currentUrl);

    if (returnUrl !== null) {
      this.redirectUrl = returnUrl;
    }
  }

  rememberUrl(url: string): void {
    const normalizedUrl = normalizeRedirectUrl(url);

    if (normalizedUrl !== null && this.isAllowedRedirectUrl(normalizedUrl)) {
      this.redirectUrl = normalizedUrl;
    }
  }

  consumeUrl(fallbackUrl: string): string {
    const url = this.redirectUrl ?? toAbsoluteRoutePath(fallbackUrl);
    this.redirectUrl = null;

    return url;
  }

  clear(): void {
    this.redirectUrl = null;
  }

  private readReturnUrl(currentUrl: string): string | null {
    const urlTree = this.parseUrl(currentUrl);
    const returnUrl = urlTree?.queryParams[AUTH_RETURN_URL_QUERY_PARAM];

    if (typeof returnUrl !== 'string') {
      return null;
    }

    const normalizedReturnUrl = normalizeRedirectUrl(returnUrl);

    return normalizedReturnUrl !== null && this.isAllowedRedirectUrl(normalizedReturnUrl)
      ? normalizedReturnUrl
      : null;
  }

  private isAllowedRedirectUrl(url: string): boolean {
    if (!url.startsWith('/') || url.startsWith('//')) {
      return false;
    }

    const urlTree = this.parseUrl(url);
    const firstPathSegment = urlTree?.root.children[PRIMARY_OUTLET]?.segments[0]?.path;

    return firstPathSegment !== undefined && !AUTHENTICATION_PATHS.has(firstPathSegment);
  }

  private parseUrl(url: string): UrlTree | null {
    try {
      return this.router.parseUrl(url);
    } catch {
      return null;
    }
  }
}

function toAbsoluteRoutePath(path: string): string {
  const normalizedPath = path.trim();

  if (!normalizedPath) {
    return '/';
  }

  return normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
}

function normalizeRedirectUrl(url: string): string | null {
  const normalizedUrl = url.trim();

  return normalizedUrl.startsWith('/') && !normalizedUrl.startsWith('//') ? normalizedUrl : null;
}
