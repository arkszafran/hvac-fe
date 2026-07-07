import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { UiInputComponent, UiModalComponent } from '../../../../ui';
import { InspectionDetails } from '../../../inspections/data/inspections.store';
import { formatInspectionDate } from '../../../inspections/utils/inspection-ui.util';

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
  readonly inspections = input<InspectionDetails[]>([]);

  readonly close = output<void>();
  readonly inspectionSelected = output<InspectionDetails>();

  protected readonly searchQuery = signal('');
  protected readonly filteredInspections = computed(() => {
    const query = normalizeValue(this.searchQuery());

    return this.inspections().filter((details) => {
      if (!query) {
        return true;
      }

      return normalizeValue([
        this.customerName(details),
        details.customer.address,
        details.customer.postalCode,
        details.customer.city,
        details.devices.map((device) => `${device.brand} ${device.model}`).join(' '),
      ].join(' ')).includes(query);
    });
  });

  protected readonly formatInspectionDate = formatInspectionDate;

  protected customerName(details: InspectionDetails): string {
    return details.customer.companyName || details.customer.fullName || this.transloco.translate('customers.fallbackName');
  }

  protected devicesLabel(details: InspectionDetails): string {
    return details.devices.map((device) => `${device.brand} ${device.model}`.trim()).join(', ');
  }
}

function normalizeValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
