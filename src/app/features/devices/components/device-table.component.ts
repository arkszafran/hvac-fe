import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { UiBadgeComponent, UiEmptyStateComponent, UiIconComponent } from '../../../ui';
import { getDeviceTypeLabel } from '../../customers/models/device.model';
import {
  Device,
  getDeviceCustomerDescription,
  getDeviceCustomerName,
  getDeviceInstallationAddress,
} from '../models/device.model';

@Component({
  selector: 'app-device-table',
  imports: [TranslocoPipe, UiBadgeComponent, UiEmptyStateComponent, UiIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './device-table.component.html',
})
export class DeviceTableComponent {
  private readonly transloco = inject(TranslocoService);

  readonly devices = input<Device[]>([]);

  readonly devicePreviewRequested = output<Device>();
  readonly customerPreviewRequested = output<Device['customer']>();

  protected readonly getDeviceCustomerName = getDeviceCustomerName;
  protected readonly getDeviceCustomerDescription = getDeviceCustomerDescription;
  protected readonly getDeviceInstallationAddress = getDeviceInstallationAddress;

  protected getDeviceTypeLabel(device: Device): string {
    return getDeviceTypeLabel(device.type, this.transloco);
  }

  protected installationDescription(device: Device): string {
    if (device.location) {
      return device.location;
    }

    return this.transloco.translate(
      device.hasCustomInstallationAddress
        ? 'devices.customInstallationAddress'
        : 'devices.customerAddress',
    );
  }

  protected deviceAriaName(device: Device): string {
    return `${device.brand || '--'} ${device.model || '--'}`.trim();
  }

  protected openDevicePreview(device: Device): void {
    this.devicePreviewRequested.emit(device);
  }

  protected handleRowClick(event: MouseEvent, device: Device): void {
    if ((event.target as HTMLElement).closest('button, a')) {
      return;
    }

    this.openDevicePreview(device);
  }
}
