import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { UiBadgeComponent, UiButtonComponent, UiModalComponent } from '../../../../ui';
import { ServiceOrderCandidate } from '../../models/service-order-candidate.model';
import {
  formatServiceOrderDate,
  getServiceOrderStatusLabel,
  getServiceOrderStatusVariant,
} from '../../utils/service-order-ui.util';

@Component({
  selector: 'app-service-order-candidate-picker-modal',
  imports: [TranslocoPipe, UiBadgeComponent, UiButtonComponent, UiModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-order-candidate-picker-modal.component.html',
})
export class ServiceOrderCandidatePickerModalComponent {
  private readonly transloco = inject(TranslocoService);

  readonly open = input(false);
  readonly title = input('');
  readonly description = input('');
  readonly customerName = input('');
  readonly deviceName = input('');
  readonly candidates = input<ServiceOrderCandidate[]>([]);
  readonly createActionLabel = input('');
  readonly cancelActionLabel = input('');

  readonly serviceOrderSelected = output<string>();
  readonly createNew = output<void>();
  readonly close = output<void>();

  protected readonly getStatusVariant = getServiceOrderStatusVariant;

  protected modalTitle(): string {
    return (
      this.title() || this.transloco.translate('serviceOrders.deviceFlow.candidateDefaultTitle')
    );
  }

  protected createLabel(): string {
    return (
      this.createActionLabel() ||
      this.transloco.translate('serviceOrders.deviceFlow.candidateCreateAction')
    );
  }

  protected closeLabel(): string {
    return this.cancelActionLabel() || this.transloco.translate('common.actions.cancel');
  }

  protected statusLabel(order: ServiceOrderCandidate): string {
    return getServiceOrderStatusLabel(order.status, this.transloco);
  }

  protected formatDate(value: string | null): string {
    return formatServiceOrderDate(value ?? '', this.transloco.getActiveLang());
  }

  protected deviceCount(order: ServiceOrderCandidate): number {
    if (order.deviceCount !== undefined) {
      return order.deviceCount;
    }

    return order.serviceData?.type === 'inspection'
      ? (order.serviceData.deviceIds?.length ?? 0)
      : 0;
  }
}
