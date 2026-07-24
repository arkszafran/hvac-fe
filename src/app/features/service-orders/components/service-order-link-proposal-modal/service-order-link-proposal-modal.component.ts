import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { UiBadgeComponent, UiButtonComponent, UiModalComponent } from '../../../../ui';
import { ServiceOrder } from '../../models/service-order.model';
import {
  formatServiceOrderDate,
  getServiceOrderStatusLabel,
  getServiceOrderStatusVariant,
} from '../../utils/service-order-ui.util';

@Component({
  selector: 'app-service-order-link-proposal-modal',
  imports: [TranslocoPipe, UiBadgeComponent, UiButtonComponent, UiModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-order-link-proposal-modal.component.html',
})
export class ServiceOrderLinkProposalModalComponent {
  private readonly transloco = inject(TranslocoService);

  readonly open = input(false);
  readonly title = input('');
  readonly description = input('');
  readonly customerName = input('');
  readonly deviceName = input('');
  readonly order = input<ServiceOrder | null>(null);
  readonly primaryActionLabel = input('');
  readonly secondaryActionLabel = input('');
  readonly cancelLabel = input('');

  readonly confirm = output<void>();
  readonly createSeparate = output<void>();
  readonly close = output<void>();

  protected readonly getStatusVariant = getServiceOrderStatusVariant;

  protected modalTitle(): string {
    return this.title() || this.transloco.translate('serviceOrders.deviceFlow.linkDefaultTitle');
  }

  protected primaryLabel(): string {
    return (
      this.primaryActionLabel() ||
      this.transloco.translate('serviceOrders.deviceFlow.linkPrimaryAction')
    );
  }

  protected secondaryLabel(): string {
    return (
      this.secondaryActionLabel() ||
      this.transloco.translate('serviceOrders.deviceFlow.linkSecondaryAction')
    );
  }

  protected closeLabel(): string {
    return this.cancelLabel() || this.transloco.translate('common.actions.cancel');
  }

  protected statusLabel(order: ServiceOrder): string {
    return getServiceOrderStatusLabel(order.status, this.transloco);
  }

  protected formatDate(value: string): string {
    return formatServiceOrderDate(value, this.transloco.getActiveLang());
  }

  protected deviceCount(order: ServiceOrder): number {
    return order.serviceData.type === 'inspection' ? order.serviceData.deviceIds.length : 0;
  }
}
