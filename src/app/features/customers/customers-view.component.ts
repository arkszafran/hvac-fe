import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { UiButtonComponent } from '../../ui';
import { CustomerFormModalComponent } from './components/customer-form-modal.component';
import { CustomerTableComponent } from './components/customer-table.component';
import { CustomerToolbarComponent } from './components/customer-toolbar.component';
import { CustomersStore } from './data/customers.store';
import { Customer, CustomerDraft } from './models/customer.model';
import { matchesCustomerSearch } from './utils/customer-search.util';

@Component({
  selector: 'app-customers-view',
  standalone: true,
  imports: [
    UiButtonComponent,
    CustomerFormModalComponent,
    CustomerTableComponent,
    CustomerToolbarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-3">
      <section class="pb-1">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h1 class="text-display tracking-[-0.04em] text-text-main">Klienci</h1>

          <div class="flex justify-start lg:justify-end">
            <ui-button size="lg" (pressed)="isCreateCustomerModalOpen.set(true)">
              <span button-icon>
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d="M10 4.5V15.5M4.5 10H15.5"
                    stroke="currentColor"
                    stroke-width="1.7"
                    stroke-linecap="round"
                  />
                </svg>
              </span>
              Dodaj klienta
            </ui-button>
          </div>
        </div>
      </section>

      <app-customer-toolbar [search]="searchQuery()" (searchChange)="searchQuery.set($event)" />

      <app-customer-table
        [customers]="filteredCustomers()"
        (customerSelected)="handleCustomerSelected($event)"
      />

      <app-customer-form-modal
        [open]="isCreateCustomerModalOpen()"
        (close)="isCreateCustomerModalOpen.set(false)"
        (save)="handleCreateCustomer($event)"
      />
    </div>
  `,
})
export class CustomersViewComponent {
  private readonly router = inject(Router);
  private readonly customersStore = inject(CustomersStore);

  protected readonly customers = this.customersStore.customers;
  protected readonly isCreateCustomerModalOpen = signal(false);
  protected readonly searchQuery = signal('');

  protected readonly filteredCustomers = computed(() => {
    const query = this.searchQuery();

    return this.customers().filter((customer) => matchesCustomerSearch(customer, query));
  });

  protected handleCreateCustomer(customer: CustomerDraft): void {
    const createdCustomer = this.customersStore.addCustomer(customer);

    this.isCreateCustomerModalOpen.set(false);
    void this.router.navigate(['/customers', createdCustomer.id]);
  }

  protected handleCustomerSelected(customer: Customer): void {
    void this.router.navigate(['/customers', customer.id]);
  }
}
