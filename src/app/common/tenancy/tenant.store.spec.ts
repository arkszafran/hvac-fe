import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';

import {
  AuthenticationSessionTenantDto,
  AuthenticationSessionUserDto,
} from '../api/authentication';
import { TenantStore } from './tenant.store';

const STORAGE_KEY = 'havac.selectedTenant';
const TENANTS: AuthenticationSessionTenantDto[] = [
  { id: 'tenant-1', name: 'Tenant One', role: 'USER' },
  { id: 'tenant-2', name: 'Tenant Two', role: 'ADMIN' },
];

describe('TenantStore', () => {
  let store: TenantStore;
  let storage: Storage;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [TenantStore] });

    store = TestBed.inject(TenantStore);
    storage = TestBed.inject(DOCUMENT).defaultView!.localStorage;
    storage.removeItem(STORAGE_KEY);
  });

  it('selects the only tenant for the authenticated user', () => {
    store.initializeForUser(createUser('user-1', [TENANTS[0]]));

    expect(store.selectedTenant()).toEqual(TENANTS[0]);
    expect(store.hasMultipleTenants()).toBe(false);
  });

  it('persists an explicitly selected tenant with its user id', () => {
    store.initializeForUser(createUser('user-1', TENANTS));
    store.selectTenant('tenant-2');

    expect(store.selectedTenant()).toEqual(TENANTS[1]);
    expect(JSON.parse(storage.getItem(STORAGE_KEY)!)).toEqual({
      userId: 'user-1',
      tenantId: 'tenant-2',
    });
  });

  it('restores a persisted tenant when it belongs to the current user and tenant list', () => {
    storage.setItem(STORAGE_KEY, JSON.stringify({ userId: 'user-1', tenantId: 'tenant-2' }));

    store.initializeForUser(createUser('user-1', TENANTS));

    expect(store.selectedTenant()).toEqual(TENANTS[1]);
  });

  it('keeps the in-memory selection when the same user session is refreshed', () => {
    store.initializeForUser(createUser('user-1', TENANTS));
    store.selectTenant('tenant-2');
    storage.removeItem(STORAGE_KEY);

    store.initializeForUser(createUser('user-1', [...TENANTS].reverse()));

    expect(store.selectedTenant()).toEqual(TENANTS[1]);
  });

  it('rejects and removes a persisted tenant assigned to another user', () => {
    storage.setItem(STORAGE_KEY, JSON.stringify({ userId: 'user-2', tenantId: 'tenant-2' }));

    store.initializeForUser(createUser('user-1', TENANTS));

    expect(store.selectedTenant()).toEqual(TENANTS[0]);
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('rejects and removes a tenant missing from the current session', () => {
    storage.setItem(STORAGE_KEY, JSON.stringify({ userId: 'user-1', tenantId: 'tenant-3' }));

    store.initializeForUser(createUser('user-1', TENANTS));

    expect(store.selectedTenant()).toEqual(TENANTS[0]);
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('does not select a tenant outside the current session', () => {
    store.initializeForUser(createUser('user-1', TENANTS));
    store.selectTenant('tenant-3');

    expect(store.selectedTenant()).toEqual(TENANTS[0]);
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
  });
});

function createUser(
  id: string,
  tenants: AuthenticationSessionTenantDto[],
): AuthenticationSessionUserDto {
  return {
    id,
    name: 'Test User',
    email: 'user@example.com',
    role: 'TENANT_USER',
    status: 'active',
    tenants,
  };
}
