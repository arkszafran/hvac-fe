import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import {
  UiBadgeComponent,
  UiButtonComponent,
  UiIconComponent,
  UiModalComponent,
} from '../../../../ui';
import { Device } from '../../../customers/models/device.model';
import { ServiceOrdersStore } from '../../data/service-orders.store';
import { ServiceOrder } from '../../models/service-order.model';
import {
  formatServiceOrderDateTime,
  getServiceOrderStatusLabel,
  getServiceOrderStatusVariant,
} from '../../utils/service-order-ui.util';

@Component({
  selector: 'app-service-order-link-proposal-modal',
  imports: [TranslocoPipe, UiBadgeComponent, UiButtonComponent, UiIconComponent, UiModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-order-link-proposal-modal.component.html',
})
export class ServiceOrderLinkProposalModalComponent {
  private readonly transloco = inject(TranslocoService);
  private readonly serviceOrdersStore = inject(ServiceOrdersStore);

  readonly open = input(false);
  readonly title = input('');
  readonly description = input('');
  readonly customerName = input('');
  readonly excludedDeviceId = input('');
  readonly proposedDate = input('');
  readonly order = input<ServiceOrder | null>(null);
  readonly primaryActionLabel = input('');
  readonly secondaryActionLabel = input('');
  readonly cancelLabel = input('');

  readonly confirm = output<void>();
  readonly createSeparate = output<void>();
  readonly close = output<void>();

  protected readonly getStatusVariant = getServiceOrderStatusVariant;
  protected readonly relatedDevices = computed(() => {
    const order = this.order();

    if (!order) {
      return [];
    }

    const excludedDeviceId = this.excludedDeviceId();
    const details = this.serviceOrdersStore
      .orderDetails()
      .find((item) => item.order.id === order.id);

    return (details?.systemDevices ?? []).filter((device) => device.id !== excludedDeviceId);
  });

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

  protected formatDateTime(value: string): string {
    return formatServiceOrderDateTime(value, this.transloco.getActiveLang());
  }

  protected relatedDeviceName(device: Device): string {
    return device.brand || '--';
  }

  protected relatedDeviceAddress(device: Device): string {
    const order = this.order();

    if (!order) {
      return '--';
    }

    const addressParts = device.hasCustomInstallationAddress
      ? [device.address, `${device.postalCode} ${device.city}`.trim()]
      : [order.address, `${order.postalCode} ${order.city}`.trim()];

    return addressParts.filter(Boolean).join(', ') || '--';
  }
}
