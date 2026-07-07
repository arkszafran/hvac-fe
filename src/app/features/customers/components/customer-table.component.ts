import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { UiTableColumn, UiTableComponent } from '../../../ui';
import { Customer } from '../models/customer.model';

@Component({
  selector: 'app-customer-table',
  standalone: true,
  imports: [TranslocoPipe, UiTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-table
      [columns]="columns()"
      [data]="customers()"
      [rowClickable]="true"
      [rowActionLabel]="'customers.table.rowActionLabel' | transloco"
      [emptyTitle]="'customers.table.emptyTitle' | transloco"
      (rowSelected)="customerSelected.emit($event)"
    />
  `,
})
export class CustomerTableComponent {
  private readonly transloco = inject(TranslocoService);
  private readonly activeLanguage = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  readonly customers = input<Customer[]>([]);
  readonly customerSelected = output<Customer>();

  protected readonly columns = computed<UiTableColumn<Customer>[]>(() => {
    this.activeLanguage();

    return [
      {
        id: 'client',
        header: this.transloco.translate('customers.table.client'),
        cell: (customer) => customer.companyName || customer.fullName,
        eyebrow: (customer) =>
          this.transloco.translate(
            customer.type === 'company'
              ? 'customers.types.company.shortLabel'
              : 'customers.types.individual.shortLabel',
          ),
        description: (customer) => (customer.type === 'company' ? customer.fullName : ''),
        tone: 'primary',
        width: '34%',
      },
      {
        id: 'contact',
        header: this.transloco.translate('customers.table.contact'),
        key: 'phone',
        description: (customer) => customer.email,
        tone: 'primary',
        width: '30%',
      },
      {
        id: 'location',
        header: this.transloco.translate('customers.table.location'),
        cell: (customer) => customer.city,
        description: (customer) => `${customer.address}, ${customer.postalCode}`,
        tone: 'primary',
        width: '36%',
      },
    ];
  });
}
