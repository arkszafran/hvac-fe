import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { UiInputComponent, UiModalComponent } from '../../../../ui';
import { ServiceOrderDetails } from '../../../service-orders/data/service-orders.store';
import { formatServiceOrderDate } from '../../../service-orders/utils/service-order-ui.util';

@Component({
  selector: 'app-visit-scheduled-inspection-picker-modal',
  standalone: true,
  imports: [FormsModule, TranslocoPipe, UiInputComponent, UiModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './visit-scheduled-inspection-picker-modal.component.html',
})
export class VisitScheduledInspectionPickerModalComponent {
  private readonly transloco = inject(TranslocoService);

  readonly open = input(false);
  readonly inspections = input<ServiceOrderDetails[]>([]);

  readonly close = output<void>();
  readonly inspectionSelected = output<ServiceOrderDetails>();

  protected readonly searchQuery = signal('');
  protected readonly filteredInspections = computed(() => {
    const query = normalizeValue(this.searchQuery());

    return this.inspections().filter((details) => {
      if (!query) {
        return true;
      }

      return normalizeValue(
        [
          this.customerName(details),
          details.order.customer.address,
          details.order.customer.postalCode,
          details.order.customer.city,
          details.systemDevices.map((device) => `${device.brand} ${device.model}`).join(' '),
        ].join(' '),
      ).includes(query);
    });
  });

  protected formatInspectionDate(value: string): string {
    return formatServiceOrderDate(value, this.transloco.getActiveLang());
  }

  protected customerName(details: ServiceOrderDetails): string {
    return (
      details.order.customer.companyName ||
      details.order.customer.fullName ||
      this.transloco.translate('customers.fallbackName')
    );
  }

  protected devicesLabel(details: ServiceOrderDetails): string {
    return details.systemDevices
      .map((device) => `${device.brand} ${device.model}`.trim())
      .join(', ');
  }
}

function normalizeValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
