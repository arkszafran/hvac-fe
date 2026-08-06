import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import {
  UiBadgeComponent,
  UiButtonComponent,
  UiEmptyStateComponent,
  UiModalComponent,
} from '../../../../ui';
import { ServiceOrder, ServiceOrderNote } from '../../models/service-order.model';
import {
  formatServiceOrderCustomerAddress,
  formatServiceOrderCustomerName,
  formatServiceOrderDate,
  formatServiceOrderNextActionDateTime,
  getServiceOrderStatusLabel,
  getServiceOrderStatusVariant,
  getServiceOrderTypeLabel,
  serviceOrderMapHref,
  serviceOrderPhoneHref,
} from '../../utils/service-order-ui.util';
import { ServiceOrderActionsMenuComponent } from '../service-order-actions-menu/service-order-actions-menu.component';

export interface ServiceOrderTableItem {
  order: ServiceOrder;
  notes: ServiceOrderNote[];
}

@Component({
  selector: 'app-service-order-table',
  imports: [
    TranslocoPipe,
    UiBadgeComponent,
    UiButtonComponent,
    UiEmptyStateComponent,
    UiModalComponent,
    ServiceOrderActionsMenuComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-order-table.component.html',
})
export class ServiceOrderTableComponent {
  private readonly transloco = inject(TranslocoService);

  readonly items = input<ServiceOrderTableItem[]>([]);
  readonly detailsRequested = output<ServiceOrder>();
  readonly scheduleRequested = output<ServiceOrder>();
  readonly visitRequested = output<ServiceOrder>();
  readonly nextContactRequested = output<ServiceOrder>();
  readonly noteRequested = output<ServiceOrder>();
  readonly assigneeRequested = output<ServiceOrder>();
  readonly cancellationRequested = output<ServiceOrder>();

  protected readonly selectedNote = signal<ServiceOrderNote | null>(null);
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

  protected formatNextActionDate(value: string): string {
    const formatted = formatServiceOrderNextActionDateTime(value, this.transloco.getActiveLang());
    const date = formatted.isToday
      ? this.transloco.translate('serviceOrders.nextAction.today')
      : formatted.date;

    return `${date}, ${formatted.time}`;
  }

  protected confirmationLabelKey(order: ServiceOrder): string {
    if (order.serviceData.type !== 'inspection' || order.source !== 'system') {
      return '';
    }

    return order.serviceData.customerConfirmationStatus === 'confirmed'
      ? 'serviceOrders.confirmation.confirmed'
      : 'serviceOrders.confirmation.notConfirmed';
  }

  protected canChangeOrder(order: ServiceOrder): boolean {
    return order.status !== 'completed' && order.status !== 'cancelled';
  }

  protected openDetails(order: ServiceOrder): void {
    this.detailsRequested.emit(order);
  }

  protected openFullNote(event: MouseEvent, note: ServiceOrderNote): void {
    event.stopPropagation();
    this.selectedNote.set(note);
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
    return formatServiceOrderCustomerName(order);
  }
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest('a, button, ui-button, ui-menu'));
}
