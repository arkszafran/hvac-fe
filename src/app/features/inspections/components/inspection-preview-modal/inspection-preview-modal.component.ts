import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { UiBadgeComponent, UiButtonComponent, UiModalComponent } from '../../../../ui';
import { Customer } from '../../../customers/models/customer.model';
import { Device } from '../../../customers/models/device.model';
import { InspectionDetails } from '../../data/inspections.store';
import { InspectionStatus } from '../../models/inspection.model';
import {
  getInspectionStatusLabel,
  getInspectionStatusVariant,
} from '../../utils/inspection-ui.util';

@Component({
  selector: 'app-inspection-preview-modal',
  imports: [
    RouterLink,
    TranslocoPipe,
    UiBadgeComponent,
    UiButtonComponent,
    UiModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inspection-preview-modal.component.html',
})
export class InspectionPreviewModalComponent {
  private readonly transloco = inject(TranslocoService);

  readonly open = input(false);
  readonly details = input<InspectionDetails | null>(null);
  readonly close = output<void>();

  protected readonly getInspectionStatusVariant = getInspectionStatusVariant;

  protected getInspectionStatusLabel(status: InspectionStatus): string {
    return getInspectionStatusLabel(status, this.transloco);
  }

  protected customerName(customer: Customer): string {
    return customer.companyName || customer.fullName || this.transloco.translate('customers.fallbackName');
  }

  protected formatDate(value: string): string {
    if (!value) {
      return this.transloco.translate('inspections.detail.unconfirmedDate');
    }

    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat(
      this.transloco.getActiveLang() === 'pl' ? 'pl-PL' : 'en-US',
    ).format(parsedDate);
  }

  protected deviceAddress(customer: Customer, device: Device): string {
    const address = device.hasCustomInstallationAddress
      ? [device.address, device.postalCode, device.city].filter(Boolean).join(', ')
      : [customer.address, customer.postalCode, customer.city].filter(Boolean).join(', ');

    return address || this.transloco.translate('common.notSpecified');
  }
}
