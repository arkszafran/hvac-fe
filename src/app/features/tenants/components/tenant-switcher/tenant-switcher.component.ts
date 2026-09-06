import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { AuthenticationSessionTenantDto } from '../../../../common/api/authentication';
import { TenantStore } from '../../../../common/tenancy';
import { UiButtonComponent, UiModalComponent } from '../../../../ui';

@Component({
  selector: 'app-tenant-switcher',
  imports: [TranslocoPipe, UiButtonComponent, UiModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tenant-switcher.component.html',
  host: {
    class: 'order-3 w-full md:order-none md:w-auto',
    '[class.hidden]': '!hasMultipleTenants()',
  },
})
export class TenantSwitcherComponent {
  private readonly tenantStore = inject(TenantStore);

  protected readonly tenants = this.tenantStore.tenants;
  protected readonly selectedTenant = this.tenantStore.selectedTenant;
  protected readonly hasMultipleTenants = this.tenantStore.hasMultipleTenants;
  protected readonly isModalOpen = signal(false);

  protected selectTenant(tenant: AuthenticationSessionTenantDto): void {
    this.tenantStore.selectTenant(tenant.id);
    this.isModalOpen.set(false);
  }
}
