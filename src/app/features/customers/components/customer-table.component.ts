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
      id: 'companyName',
      header: 'Nazwa firmy',
      key: 'companyName',
      width: '20%',
    },
    {
      id: 'fullName',
      header: 'Imie i nazwisko',
      key: 'fullName',
      width: '17%',
    },
    {
      id: 'phone',
      header: 'Telefon',
      key: 'phone',
      width: '15%',
    },
    {
      id: 'email',
      header: 'Email',
      key: 'email',
      width: '20%',
    },
    {
      id: 'location',
      header: 'Adres',
      cell: (customer) => `${customer.address}, ${customer.postalCode} ${customer.city}`,
      width: '28%',
    },
  ];
}
