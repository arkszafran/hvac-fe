import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { UiInputComponent, UiModalComponent } from '../../../../ui';
import { Customer } from '../../../customers/models/customer.model';

@Component({
  selector: 'app-visit-customer-picker-modal',
  standalone: true,
  imports: [FormsModule, UiInputComponent, UiModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './visit-customer-picker-modal.component.html',
})
export class VisitCustomerPickerModalComponent {
  readonly open = input(false);
  readonly customers = input<Customer[]>([]);

  readonly close = output<void>();
  readonly customerSelected = output<Customer>();

  protected readonly searchQuery = signal('');
  protected readonly filteredCustomers = computed(() => {
    const query = normalizeValue(this.searchQuery());

    return this.customers().filter((customer) => {
      if (!query) {
        return true;
      }

      return normalizeValue([
        customer.companyName,
        customer.fullName,
        customer.phone,
        customer.email,
        customer.address,
        customer.postalCode,
        customer.city,
      ].join(' ')).includes(query);
    });
  });

  protected selectCustomer(customer: Customer): void {
    this.customerSelected.emit(customer);
  }

  protected customerName(customer: Customer): string {
    return customer.companyName || customer.fullName || 'Klient';
  }

  protected customerAddress(customer: Customer): string {
    return [customer.address, `${customer.postalCode} ${customer.city}`.trim()]
      .filter(Boolean)
      .join(', ') || '--';
  }
}

function normalizeValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
