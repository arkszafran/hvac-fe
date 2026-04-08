import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

import { UiButtonComponent } from '../../ui';
import { CUSTOMER_MOCKS } from './data/customer.mock';
import { CustomerTableComponent } from './components/customer-table.component';
import { CustomerToolbarComponent } from './components/customer-toolbar.component';
import { matchesCustomerSearch } from './utils/customer-search.util';

@Component({
  selector: 'app-customers-view',
  standalone: true,
  imports: [UiButtonComponent, CustomerTableComponent, CustomerToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 class="text-display tracking-[-0.035em] text-text-main">Klienci</h1>

        <div class="flex justify-start sm:justify-end">
          <ui-button>
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

      <div class="pt-1">
        <app-customer-toolbar [search]="searchQuery()" (searchChange)="searchQuery.set($event)" />
      </div>

      <app-customer-table [customers]="filteredCustomers()" />
    </div>
  `,
})
export class CustomersViewComponent {
  protected readonly customers = CUSTOMER_MOCKS;
  protected readonly searchQuery = signal('');

  protected readonly filteredCustomers = computed(() => {
    const query = this.searchQuery();

    return this.customers.filter((customer) => matchesCustomerSearch(customer, query));
  });
}
