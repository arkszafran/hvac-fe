import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { UiBadgeComponent, UiButtonComponent, UiEmptyStateComponent } from '../../../../ui';
import { ServiceOrder } from '../../models/service-order.model';
import {
  formatServiceOrderCustomerAddress,
  formatServiceOrderCustomerName,
  formatServiceOrderDate,
  getServiceOrderStatusLabel,
  getServiceOrderStatusVariant,
  getServiceOrderTypeLabel,
  serviceOrderMapHref,
  serviceOrderPhoneHref,
} from '../../utils/service-order-ui.util';

@Component({
  selector: 'app-service-order-table',
  imports: [TranslocoPipe, UiBadgeComponent, UiButtonComponent, UiEmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-order-table.component.html',
})
export class ServiceOrderTableComponent {
  private readonly transloco = inject(TranslocoService);

  readonly orders = input<ServiceOrder[]>([]);
  readonly detailsRequested = output<ServiceOrder>();
  readonly scheduleRequested = output<ServiceOrder>();
  readonly visitRequested = output<ServiceOrder>();
  readonly cancellationRequested = output<ServiceOrder>();

  protected readonly formatCustomerName = formatServiceOrderCustomerName;
  protected readonly formatCustomerAddress = formatServiceOrderCustomerAddress;
  protected readonly getStatusVariant = getServiceOrderStatusVariant;
  protected readonly mapHref = serviceOrderMapHref;
  protected readonly phoneHref = serviceOrderPhoneHref;

  protected getTypeLabel(order: ServiceOrder): string {
    return getServiceOrderTypeLabel(order.type, this.transloco);
  }

  protected getStatusLabel(order: ServiceOrder): string {
    return getServiceOrderStatusLabel(order.status, this.transloco);
  }

  protected formatDate(value: string): string {
    return formatServiceOrderDate(value, this.transloco.getActiveLang());
  }

  protected confirmationLabelKey(order: ServiceOrder): string {
    if (order.serviceData.type !== 'inspection' || order.status !== 'contact_required') {
      return '';
    }

    switch (order.serviceData.customerConfirmationStatus) {
      case 'confirmed':
        return 'serviceOrders.confirmation.confirmed';
      case 'not_confirmed':
        return 'serviceOrders.confirmation.notConfirmed';
      case 'pending':
        return '';
    }
  }

  protected canChangeOrder(order: ServiceOrder): boolean {
    return order.status !== 'completed' && order.status !== 'cancelled';
  }

  protected openDetails(order: ServiceOrder): void {
    this.detailsRequested.emit(order);
  }

  protected handleRowClick(event: MouseEvent, order: ServiceOrder): void {
    if (isInteractiveTarget(event.target)) {
      return;
    }

    this.openDetails(order);
  }

  protected handleRowKeydown(event: KeyboardEvent, order: ServiceOrder): void {
    if (event.target !== event.currentTarget || (event.key !== 'Enter' && event.key !== ' ')) {
      return;
    }

    event.preventDefault();
    this.openDetails(order);
  }

  protected orderAriaName(order: ServiceOrder): string {
    return formatServiceOrderCustomerName(order.customer);
  }
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest('a, button, ui-button'));
}
