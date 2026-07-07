import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { UiButtonComponent, UiModalComponent } from '../../../ui';
import { CustomerTableComponent } from '../../customers/components/customer-table.component';
import { CustomerToolbarComponent } from '../../customers/components/customer-toolbar.component';
import { Customer } from '../../customers/models/customer.model';
import { matchesCustomerSearch } from '../../customers/utils/customer-search.util';

@Component({
  selector: 'app-device-customer-picker-modal',
  standalone: true,
  imports: [
    TranslocoPipe,
    UiButtonComponent,
    UiModalComponent,
    CustomerTableComponent,
    CustomerToolbarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-modal
      [open]="open()"
      [title]="'devices.customerPicker.title' | transloco"
      [description]="'devices.customerPicker.description' | transloco"
      (close)="close.emit()"
    >
      <div class="space-y-4">
        <app-customer-toolbar [search]="searchQuery()" (searchChange)="searchQuery.set($event)" />

        <app-customer-table
          [customers]="filteredCustomers()"
          (customerSelected)="customerSelected.emit($event)"
        />
      </div>

      <div modal-footer class="flex justify-end">
        <ui-button variant="secondary" (pressed)="close.emit()">{{ 'common.actions.close' | transloco }}</ui-button>
      </div>
    </ui-modal>
  `,
})
export class DeviceCustomerPickerModalComponent {
  readonly open = input(false);
  readonly customers = input<Customer[]>([]);

  readonly close = output<void>();
  readonly customerSelected = output<Customer>();

  protected readonly searchQuery = signal('');
  protected readonly filteredCustomers = computed(() => {
    const query = this.searchQuery();

    return this.customers().filter((customer) => matchesCustomerSearch(customer, query));
  });
}
