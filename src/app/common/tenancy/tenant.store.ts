import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';

import {
  type AuthenticationSessionTenantDto,
  type AuthenticationSessionUserDto,
} from '../api/authentication';

const TENANT_SELECTION_STORAGE_KEY = 'havac.selectedTenant';

interface PersistedTenantSelection {
  userId: string;
  tenantId: string;
}

@Injectable({ providedIn: 'root' })
export class TenantStore {
  private readonly document = inject(DOCUMENT);
  private readonly currentUserIdState = signal<string | null>(null);
  private readonly tenantsState = signal<readonly AuthenticationSessionTenantDto[]>([]);
  private readonly selectedTenantState = signal<AuthenticationSessionTenantDto | null>(null);

  readonly tenants = this.tenantsState.asReadonly();
  readonly selectedTenant = this.selectedTenantState.asReadonly();
  readonly hasMultipleTenants = computed(() => this.tenants().length > 1);

  initializeForUser(user: AuthenticationSessionUserDto): void {
    const tenants = [...user.tenants];
    const persistedSelection = this.readPersistedSelection();
    const currentTenant =
      this.currentUserIdState() === user.id
        ? (tenants.find((tenant) => tenant.id === this.selectedTenant()?.id) ?? null)
        : null;
    const persistedTenant =
      persistedSelection?.userId === user.id
        ? (tenants.find((tenant) => tenant.id === persistedSelection.tenantId) ?? null)
        : null;

    if (persistedSelection !== null && persistedTenant === null) {
      this.clearPersistedSelection();
    }

    this.currentUserIdState.set(user.id);
    this.tenantsState.set(tenants);
    this.selectedTenantState.set(persistedTenant ?? currentTenant ?? tenants[0] ?? null);
  }

  selectTenant(tenantId: string): void {
    const userId = this.currentUserIdState();
    const tenant = this.tenants().find((item) => item.id === tenantId);

    if (!userId || !tenant) {
      return;
    }

    this.selectedTenantState.set(tenant);
    this.persistSelection({ userId, tenantId: tenant.id });
  }

  clearSession(): void {
    this.currentUserIdState.set(null);
    this.tenantsState.set([]);
    this.selectedTenantState.set(null);
  }

  private readPersistedSelection(): PersistedTenantSelection | null {
    try {
      const value = this.document.defaultView?.localStorage.getItem(TENANT_SELECTION_STORAGE_KEY);

      if (!value) {
        return null;
      }

      const parsedValue: unknown = JSON.parse(value);

      if (isPersistedTenantSelection(parsedValue)) {
        return parsedValue;
      }

      this.clearPersistedSelection();

      return null;
    } catch {
      this.clearPersistedSelection();

      return null;
    }
  }

  private persistSelection(selection: PersistedTenantSelection): void {
    try {
      this.document.defaultView?.localStorage.setItem(
        TENANT_SELECTION_STORAGE_KEY,
        JSON.stringify(selection),
      );
    } catch {
      // The in-memory selection remains usable when browser storage is unavailable.
    }
  }

  private clearPersistedSelection(): void {
    try {
      this.document.defaultView?.localStorage.removeItem(TENANT_SELECTION_STORAGE_KEY);
    } catch {
      // Browser storage can be unavailable or blocked.
    }
  }
}

function isPersistedTenantSelection(value: unknown): value is PersistedTenantSelection {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const selection = value as Record<string, unknown>;

  return (
    typeof selection['userId'] === 'string' &&
    selection['userId'].length > 0 &&
    typeof selection['tenantId'] === 'string' &&
    selection['tenantId'].length > 0
  );
}
