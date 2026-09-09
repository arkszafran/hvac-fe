import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import {
  UiButtonComponent,
  UiEmptyStateComponent,
  UiModalComponent,
  UiPaginationComponent,
} from '../../../ui';
import { CustomerTableComponent } from '../../customers/components/customer-table.component';
import { CustomerToolbarComponent } from '../../customers/components/customer-toolbar.component';
import { CustomersListStore } from '../../customers/data/customers-list.store';
import { Customer } from '../../customers/models/customer.model';

@Component({
  selector: 'app-device-customer-picker-modal',
  imports: [
    TranslocoPipe,
    UiButtonComponent,
    UiEmptyStateComponent,
    UiModalComponent,
    UiPaginationComponent,
    CustomerTableComponent,
    CustomerToolbarComponent,
  ],
  providers: [CustomersListStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './device-customer-picker-modal.component.html',
})
export class DeviceCustomerPickerModalComponent {
  private readonly customersStore = inject(CustomersListStore);

  readonly open = input(false);

  readonly close = output<void>();
  readonly customerSelected = output<Customer>();

  protected readonly customers = this.customersStore.customers;
  protected readonly pagination = this.customersStore.pagination;
  protected readonly hasLoaded = this.customersStore.hasLoaded;
  protected readonly hasError = this.customersStore.hasError;
  protected readonly searchControl = new FormControl('', { nonNullable: true });

  constructor() {
    effect(() => {
      if (this.open()) {
        untracked(() => this.customersStore.load());
      }
    });

    this.searchControl.valueChanges
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((query) => this.customersStore.search(query));
  }

  protected retryLoad(): void {
    this.customersStore.load();
  }

  protected handlePageChange(page: number): void {
    this.customersStore.goToPage(page);
  }
}
