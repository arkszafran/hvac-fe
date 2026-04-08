import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { UiTableColumn, UiTableComponent } from '../../../ui';
import { Customer } from '../models/customer.model';

@Component({
  selector: 'app-customer-table',
  standalone: true,
  imports: [UiTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <ui-table [columns]="columns" [data]="customers()" emptyTitle="Brak klientow" /> `,
})
export class CustomerTableComponent {
  readonly customers = input<Customer[]>([]);

  protected readonly columns: UiTableColumn<Customer>[] = [
    {
      id: 'client',
      header: 'Klient',
      cell: (customer) => customer.companyName || customer.fullName,
      eyebrow: (customer) => (customer.type === 'company' ? 'Firma' : 'Klient indywidualny'),
      description: (customer) => (customer.type === 'company' ? customer.fullName : ''),
      tone: 'primary',
      width: '34%',
    },
    {
      id: 'contact',
      header: 'Kontakt',
      key: 'phone',
      description: (customer) => customer.email,
      tone: 'primary',
      width: '30%',
    },
    {
      id: 'location',
      header: 'Lokalizacja',
      cell: (customer) => customer.city,
      description: (customer) => `${customer.address}, ${customer.postalCode}`,
      tone: 'primary',
      width: '36%',
    },
  ];
}
