import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import {
  UiEmptyStateComponent,
  UiInputComponent,
  UiModalComponent,
  UiPaginationComponent,
} from '../../../../ui';
import { CustomersListStore } from '../../../customers/data/customers-list.store';
import { Customer } from '../../../customers/models/customer.model';

@Component({
  selector: 'app-visit-customer-picker-modal',
  imports: [
    ReactiveFormsModule,
    TranslocoPipe,
    UiEmptyStateComponent,
    UiInputComponent,
    UiModalComponent,
    UiPaginationComponent,
  ],
  providers: [CustomersListStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './visit-customer-picker-modal.component.html',
})
export class VisitCustomerPickerModalComponent {
  private readonly transloco = inject(TranslocoService);
  private readonly customersStore = inject(CustomersListStore);

  readonly open = input(false);
  readonly apiBacked = input(false);
  readonly customers = input<Customer[]>([]);

  readonly close = output<void>();
  readonly customerSelected = output<Customer>();

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly localSearchQuery = signal('');
  protected readonly visibleCustomers = computed(() => {
    if (this.apiBacked()) {
      return this.customersStore.customers();
    }

    const query = normalizeValue(this.localSearchQuery());

    return this.customers().filter((customer) => {
      if (!query) {
        return true;
      }

      return normalizeValue(
        [
          customer.companyName,
          customer.fullName,
          customer.phone,
          customer.email,
          customer.address,
          customer.postalCode,
          customer.city,
        ].join(' '),
      ).includes(query);
    });
  });
  protected readonly pagination = this.customersStore.pagination;
  protected readonly hasLoaded = this.customersStore.hasLoaded;
  protected readonly hasError = this.customersStore.hasError;

  constructor() {
    effect(() => {
      if (this.open() && this.apiBacked()) {
        untracked(() => this.customersStore.load());
      }
    });

    this.searchControl.valueChanges
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((query) => {
        this.localSearchQuery.set(query);

        if (this.apiBacked()) {
          this.customersStore.search(query);
        }
      });
  }

  protected retryLoad(): void {
    this.customersStore.load();
  }

  protected handlePageChange(page: number): void {
    this.customersStore.goToPage(page);
  }

  protected selectCustomer(customer: Customer): void {
    this.customerSelected.emit(customer);
  }

  protected customerName(customer: Customer): string {
    return (
      customer.companyName ||
      customer.fullName ||
      this.transloco.translate('customers.fallbackName')
    );
  }

  protected customerAddress(customer: Customer): string {
    return (
      [customer.address, `${customer.postalCode} ${customer.city}`.trim()]
        .filter(Boolean)
        .join(', ') || '--'
    );
  }
}

function normalizeValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
