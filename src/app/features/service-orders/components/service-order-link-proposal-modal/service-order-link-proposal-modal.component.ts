import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import {
  UiBadgeComponent,
  UiButtonComponent,
  UiIconComponent,
  UiModalComponent,
} from '../../../../ui';
import {
  ServiceOrderCandidate,
  ServiceOrderRelatedDevice,
} from '../../models/service-order-candidate.model';
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

  readonly open = input(false);
  readonly title = input('');
  readonly description = input('');
  readonly customerName = input('');
  readonly excludedDeviceId = input('');
  readonly proposedDate = input('');
  readonly order = input<ServiceOrderCandidate | null>(null);
  readonly relatedDevices = input<ServiceOrderRelatedDevice[]>([]);
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

  protected statusLabel(order: ServiceOrderCandidate): string {
    return getServiceOrderStatusLabel(order.status, this.transloco);
  }

  protected formatDateTime(value: string): string {
    return formatServiceOrderDateTime(value, this.transloco.getActiveLang());
  }

  protected relatedDeviceName(device: ServiceOrderRelatedDevice): string {
    return device.brand || '--';
  }

  protected relatedDeviceAddress(device: ServiceOrderRelatedDevice): string {
    return device.address || '--';
  }
}
