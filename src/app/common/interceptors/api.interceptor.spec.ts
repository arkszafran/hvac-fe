import { HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { firstValueFrom, of } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ToastService } from '../../ui/toast/toast.service';
import { AuthService } from '../authentication';
import { AppLoaderService } from '../loader/app-loader.service';
import { TenantStore } from '../tenancy';
import { apiInterceptor } from './api.interceptor';

describe('apiInterceptor tenant header', () => {
  let selectedTenantId: string | null;

  beforeEach(() => {
    selectedTenantId = 'tenant-1';

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: {} },
        { provide: Router, useValue: {} },
        { provide: TranslocoService, useValue: {} },
        { provide: ToastService, useValue: {} },
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

  it('adds x-tenant-id to API requests', async () => {
    const request = await interceptRequest(`${environment.api.baseUrl}/customers`);

    expect(request.headers.get('x-tenant-id')).toBe('tenant-1');
  });

  it('does not add x-tenant-id to external requests', async () => {
    const request = await interceptRequest('https://example.com/customers');

    expect(request.headers.has('x-tenant-id')).toBe(false);
  });

  it('does not add x-tenant-id before a tenant is selected', async () => {
    selectedTenantId = null;

    const request = await interceptRequest(`${environment.api.baseUrl}/customers`);

    expect(request.headers.has('x-tenant-id')).toBe(false);
  });
});

async function interceptRequest(url: string): Promise<HttpRequest<unknown>> {
  const interceptedRequest: { value: HttpRequest<unknown> | null } = { value: null };
  const next: HttpHandlerFn = (request) => {
    interceptedRequest.value = request;

    return of(new HttpResponse({ status: 200 }));
  };
  const response = TestBed.runInInjectionContext(() =>
    apiInterceptor(new HttpRequest('GET', url), next),
  );

  await firstValueFrom(response);

  if (interceptedRequest.value === null) {
    throw new Error('The request did not reach the next HTTP handler.');
  }

  return interceptedRequest.value;
}
