import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { CustomerServiceOrderDto } from '../../../../common/api';
import { UiBadgeComponent, UiEmptyStateComponent, UiIconComponent } from '../../../../ui';
import {
  formatServiceOrderDate,
  getServiceOrderStatusLabel,
  getServiceOrderStatusVariant,
  getServiceOrderTypeLabel,
} from '../../../service-orders/utils/service-order-ui.util';

@Component({
  selector: 'app-customer-service-order-list',
  imports: [RouterLink, TranslocoPipe, UiBadgeComponent, UiEmptyStateComponent, UiIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './customer-service-order-list.component.html',
})
export class CustomerServiceOrderListComponent {
  private readonly router = inject(Router);
  private readonly transloco = inject(TranslocoService);

  readonly orders = input<CustomerServiceOrderDto[]>([]);

  protected readonly getStatusVariant = getServiceOrderStatusVariant;

  protected getTypeLabel(order: CustomerServiceOrderDto): string {
    return getServiceOrderTypeLabel(order.type, this.transloco);
  }

  protected getStatusLabel(order: CustomerServiceOrderDto): string {
    return getServiceOrderStatusLabel(order.status, this.transloco);
  }

  protected formatDate(value: string): string {
    return formatServiceOrderDate(value, this.transloco.getActiveLang());
  }

  protected handleRowClick(event: MouseEvent, order: CustomerServiceOrderDto): void {
    if (isInteractiveTarget(event.target)) {
      return;
    }

    void this.router.navigate(['/service-orders', order.id], {
      queryParams: { returnCustomerId: order.customerId },
    });
  }
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest('a, button'));
}
