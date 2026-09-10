import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { UiButtonComponent, UiInputComponent, UiModalComponent } from '../../../../ui';
import { Customer } from '../../../customers/models/customer.model';
import { Device } from '../../../customers/models/device.model';

@Component({
  selector: 'app-visit-device-picker-modal',
  standalone: true,
  imports: [FormsModule, TranslocoPipe, UiButtonComponent, UiInputComponent, UiModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './visit-device-picker-modal.component.html',
})
export class VisitDevicePickerModalComponent {
  private readonly transloco = inject(TranslocoService);

  readonly open = input(false);
  readonly customer = input<Customer | null>(null);
  readonly selectedDeviceIds = input<string[]>([]);

  readonly close = output<void>();
  readonly selectionSaved = output<string[]>();

  protected readonly searchQuery = signal('');
  protected readonly workingSelection = signal<string[]>([]);
  protected readonly devices = computed(() => this.customer()?.devices ?? []);
  protected readonly filteredDevices = computed(() => {
    const query = normalizeValue(this.searchQuery());

    return this.devices().filter((device) => {
      if (!query) {
        return true;
      }

      return normalizeValue(
        [
          device.brand,
          device.model,
          device.serialNumber,
          device.location,
          this.deviceAddress(device),
        ].join(' '),
      ).includes(query);
    });
  });

  constructor() {
    effect(() => {
      if (this.open()) {
        this.workingSelection.set(this.selectedDeviceIds());
      }
    });
  }

  protected toggleDevice(deviceId: string): void {
    this.workingSelection.update((deviceIds) =>
      deviceIds.includes(deviceId)
        ? deviceIds.filter((currentId) => currentId !== deviceId)
        : [...deviceIds, deviceId],
    );
  }

  protected saveSelection(): void {
    this.selectionSaved.emit(this.workingSelection());
  }

  protected deviceName(device: Device): string {
    return (
      `${device.brand} ${device.model}`.trim() || this.transloco.translate('devices.table.device')
    );
  }

  protected deviceAddress(device: Device): string {
    const customer = this.customer();
    const street = device.hasCustomInstallationAddress ? device.address : customer?.address;
    const postalCode = device.hasCustomInstallationAddress
      ? device.postalCode
      : customer?.postalCode;
    const city = device.hasCustomInstallationAddress ? device.city : customer?.city;

    return [street, `${postalCode ?? ''} ${city ?? ''}`.trim()].filter(Boolean).join(', ') || '--';
  }
}

function normalizeValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
