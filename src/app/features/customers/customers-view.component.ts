import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { CustomersApi } from '../../common/api';
import {
  ToastService,
  UiButtonComponent,
  UiEmptyStateComponent,
  UiIconComponent,
  UiPaginationComponent,
} from '../../ui';
import { CustomerFormModalComponent } from './components/customer-form-modal.component';
import { CustomerTableComponent } from './components/customer-table.component';
import { CustomerToolbarComponent } from './components/customer-toolbar.component';
import { toCreateCustomerDto } from './data/customer-api.mapper';
import { CustomersListStore } from './data/customers-list.store';
import { Customer, CustomerDraft } from './models/customer.model';

@Component({
  selector: 'app-customers-view',
  imports: [
    TranslocoPipe,
    UiButtonComponent,
    UiEmptyStateComponent,
    UiIconComponent,
    UiPaginationComponent,
    CustomerFormModalComponent,
    CustomerTableComponent,
    CustomerToolbarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './customers-view.component.html',
})
export class CustomersViewComponent {
  private readonly router = inject(Router);
  private readonly customersApi = inject(CustomersApi);
  private readonly customersListStore = inject(CustomersListStore);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  protected readonly customers = this.customersListStore.customers;
  protected readonly pagination = this.customersListStore.pagination;
  protected readonly hasLoaded = this.customersListStore.hasLoaded;
  protected readonly hasError = this.customersListStore.hasError;
  protected readonly isCreateCustomerModalOpen = signal(false);
  protected readonly searchControl = new FormControl(this.customersListStore.query(), {
    nonNullable: true,
  });

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((query) => this.customersListStore.search(query));

    this.customersListStore.load();
  }

  protected handleCreateCustomer(customer: CustomerDraft): void {
    this.customersApi.createCustomer(toCreateCustomerDto(customer)).subscribe({
      next: ({ data }) => {
        this.isCreateCustomerModalOpen.set(false);
        this.toast.success(this.transloco.translate('customers.toast.created'));
        void this.router.navigate(['/customers', data.id]);
      },
      error: () => undefined,
    });
  }

  protected handleCustomerSelected(customer: Customer): void {
    void this.router.navigate(['/customers', customer.id]);
  }

  protected handlePageChange(page: number): void {
    this.customersListStore.goToPage(page);
  }

  protected retryLoad(): void {
    this.customersListStore.load();
  }
}
