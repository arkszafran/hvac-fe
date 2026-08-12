import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { UiBadgeComponent, UiEmptyStateComponent, UiIconComponent } from '../../../ui';
import { UiMapPinIconComponent } from '../../../ui/map-pin-icon/map-pin-icon.component';
import { Customer } from '../models/customer.model';
import {
  customerEmailHref,
  customerMapHref,
  customerPhoneHref,
  formatCustomerAddress,
  formatCustomerName,
} from '../utils/customer-ui.util';

@Component({
  selector: 'app-customer-table',
  imports: [
    TranslocoPipe,
    UiBadgeComponent,
    UiEmptyStateComponent,
    UiIconComponent,
    UiMapPinIconComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './customer-table.component.html',
})
export class CustomerTableComponent {
  private readonly transloco = inject(TranslocoService);
  private readonly activeLanguage = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  readonly customers = input<Customer[]>([]);
  readonly enableContactLinks = input(true);
  readonly customerSelected = output<Customer>();

  protected readonly formatName = formatCustomerName;
  protected readonly formatAddress = formatCustomerAddress;
  protected readonly phoneHref = customerPhoneHref;
  protected readonly emailHref = customerEmailHref;
  protected readonly mapHref = customerMapHref;

  protected typeLabel(customer: Customer): string {
    this.activeLanguage();
    return this.transloco.translate(
      customer.type === 'company'
        ? 'customers.types.company.shortLabel'
        : 'customers.types.individual.shortLabel',
    );
  }

  protected handleRowClick(event: MouseEvent, customer: Customer): void {
    if (isInteractiveTarget(event.target)) {
      return;
    }

    this.customerSelected.emit(customer);
  }
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest('a, button'));
}
