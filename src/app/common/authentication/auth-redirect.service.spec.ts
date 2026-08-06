import { Location } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AuthRedirectService } from './auth-redirect.service';

describe('AuthRedirectService', () => {
  let currentUrl: string;
  let service: AuthRedirectService;

  beforeEach(() => {
    currentUrl = '';

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: Location,
          useValue: {
            path: () => currentUrl,
          },
        },
      ],
    });

    service = TestBed.inject(AuthRedirectService);
  });

  it('preserves the current application URL with query params and fragment', () => {
    currentUrl = '/customers/123?tab=devices#details';

    service.rememberCurrentUrl();

    expect(service.consumeUrl('/dashboard')).toBe('/customers/123?tab=devices#details');
    expect(service.consumeUrl('/dashboard')).toBe('/dashboard');
  });

  it('restores a return URL from the login route', () => {
    const returnUrl = '/service-orders/456?source=visits#summary';
    currentUrl = `/login?returnUrl=${encodeURIComponent(returnUrl)}`;

    service.rememberCurrentUrl();

    expect(service.consumeUrl('/dashboard')).toBe(returnUrl);
  });

  it('ignores authentication and external URLs', () => {
    service.rememberUrl('/login');
    service.rememberUrl('//example.com/customers');
    service.rememberUrl('https://example.com/customers');

    expect(service.consumeUrl('/dashboard')).toBe('/dashboard');
  });
});
