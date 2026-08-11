import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { UiButtonComponent, UiIconComponent } from '../../ui';
import { CustomerFormModalComponent } from './components/customer-form-modal.component';
import { CustomerTableComponent } from './components/customer-table.component';
import { CustomerToolbarComponent } from './components/customer-toolbar.component';
import { CustomersStore } from './data/customers.store';
import { Customer, CustomerDraft } from './models/customer.model';
import { matchesCustomerSearch } from './utils/customer-search.util';

@Component({
  selector: 'app-customers-view',
  imports: [
    TranslocoPipe,
    UiButtonComponent,
    UiIconComponent,
    CustomerFormModalComponent,
    CustomerTableComponent,
    CustomerToolbarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './customers-view.component.html',
})
export class CustomersViewComponent {
  private readonly router = inject(Router);
  private readonly customersStore = inject(CustomersStore);

  protected readonly customers = this.customersStore.customers;
  protected readonly isCreateCustomerModalOpen = signal(false);
  protected readonly searchControl = new FormControl('', { nonNullable: true });
  private readonly searchQuery = toSignal(this.searchControl.valueChanges, { initialValue: '' });

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
