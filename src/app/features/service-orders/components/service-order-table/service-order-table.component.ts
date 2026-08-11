import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import {
  UiBadgeComponent,
  UiButtonComponent,
  UiEmptyStateComponent,
  UiIconComponent,
} from '../../../../ui';
import { classNames } from '../../../../ui/utils/classnames';
import type { Customer } from '../../../customers/models/customer.model';
import { ServiceOrder, ServiceOrderNote } from '../../models/service-order.model';
import {
  formatServiceOrderCustomerName,
  formatServiceOrderNextActionDateTime,
  getServiceOrderInspectionConfirmation,
  getServiceOrderStatusLabel,
  getServiceOrderStatusVariant,
  getServiceOrderTypeLabel,
  serviceOrderPhoneHref,
} from '../../utils/service-order-ui.util';
import { ServiceOrderActionsMenuComponent } from '../service-order-actions-menu/service-order-actions-menu.component';
import { ServiceOrderCustomerLinksComponent } from '../service-order-customer-links/service-order-customer-links.component';
import { ServiceOrderInspectionConfirmationComponent } from '../service-order-inspection-confirmation/service-order-inspection-confirmation.component';

export interface ServiceOrderTableItem {
  order: ServiceOrder;
  notes: ServiceOrderNote[];
  systemCustomer?: Customer;
}

@Component({
  selector: 'app-service-order-table',
  imports: [
    TranslocoPipe,
    UiBadgeComponent,
    UiButtonComponent,
    UiEmptyStateComponent,
    UiIconComponent,
    ServiceOrderActionsMenuComponent,
    ServiceOrderCustomerLinksComponent,
    ServiceOrderInspectionConfirmationComponent,
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

  protected readonly formatCustomerName = formatServiceOrderCustomerName;
  protected readonly getStatusVariant = getServiceOrderStatusVariant;
  protected readonly phoneHref = serviceOrderPhoneHref;
  protected readonly inspectionConfirmation = getServiceOrderInspectionConfirmation;

  protected getTypeLabel(order: ServiceOrder): string {
    return getServiceOrderTypeLabel(order.type, this.transloco);
  }

  protected getStatusLabel(order: ServiceOrder): string {
    return getServiceOrderStatusLabel(order.status, this.transloco);
  }

  protected formatNextActionDate(value: string): string {
    const formatted = formatServiceOrderNextActionDateTime(value, this.transloco.getActiveLang());
    const date = formatted.isToday
      ? this.transloco.translate('serviceOrders.nextAction.today')
      : formatted.date;

    return `${date}, ${formatted.time}`;
  }

  protected nextActionLabelKey(order: ServiceOrder): string {
    if (order.status === 'scheduled') {
      return 'serviceOrders.nextAction.visitCustomer';
    }

    if (order.status === 'new' || order.status === 'contact_required') {
      return 'serviceOrders.nextAction.callCustomer';
    }

    return '';
  }

  protected nextActionDate(order: ServiceOrder): string {
    const date = order.nextContactAt || order.scheduledAt;

    return date
      ? this.formatNextActionDate(date)
      : this.transloco.translate('serviceOrders.nextAction.today');
  }

  protected nextActionDotClasses(order: ServiceOrder): string {
    return classNames(
      'mt-1.5 size-2 shrink-0 rounded-full',
      order.status === 'contact_required' && 'bg-warning',
      order.status === 'scheduled' && 'bg-info',
      order.status === 'new' && 'bg-brand',
    );
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

  protected orderAriaName(order: ServiceOrder): string {
    return formatServiceOrderCustomerName(order);
  }
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest('a, button, ui-button, ui-menu'));
}
