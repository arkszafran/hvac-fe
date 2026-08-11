import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { UiBadgeComponent, UiButtonComponent, UiIconComponent } from '../../../ui';
import { ServiceOrdersStore } from '../../service-orders/data/service-orders.store';
import { toInspectionDateTimeLocalValue } from '../models/device-inspection.model';
import { Device, getDeviceTypeLabel } from '../models/device.model';

@Component({
  selector: 'app-device-list',
  imports: [RouterLink, TranslocoPipe, UiBadgeComponent, UiButtonComponent, UiIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './device-list.component.html',
})
export class DeviceListComponent {
  private readonly router = inject(Router);
  private readonly transloco = inject(TranslocoService);
  private readonly serviceOrdersStore = inject(ServiceOrdersStore);
  private readonly activeLanguage = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  readonly customerId = input.required<string>();
  readonly devices = input<Device[]>([]);
  readonly deviceEditRequested = output<Device>();

  protected openDevice(event: MouseEvent, device: Device): void {
    if (isInteractiveTarget(event.target)) {
      return;
    }

    void this.router.navigate(['/customers', this.customerId(), 'devices', device.id]);
  }

  protected deviceTypeLabel(device: Device): string {
    this.activeLanguage();
    return getDeviceTypeLabel(device.type, this.transloco);
  }

  protected formatDate(value: string): string {
    if (!value) {
      return '--';
    }

    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
      return value;
    }

    const locale = this.activeLanguage() === 'pl' ? 'pl-PL' : 'en-US';
    return new Intl.DateTimeFormat(locale).format(parsedDate);
  }

  protected formatDateTime(value: string): string {
    const normalizedValue = toInspectionDateTimeLocalValue(value);

    if (!normalizedValue) {
      return value || '--';
    }

    const locale = this.activeLanguage() === 'pl' ? 'pl-PL' : 'en-US';
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(normalizedValue));
  }

  protected deviceAddress(device: Device): string {
    if (!device.hasCustomInstallationAddress) {
      return this.transloco.translate('devices.sameAddressAsCustomer');
    }

    return (
      [device.address, `${device.postalCode} ${device.city}`.trim()].filter(Boolean).join(', ') ||
      '--'
    );
  }

  protected inspectionLabel(device: Device): string {
    this.activeLanguage();
    const activeInspection = this.serviceOrdersStore.getActiveInspectionOrderByDeviceId(device.id);

    if (!activeInspection) {
      return this.transloco.translate('devices.inspections.disabled');
    }

    return activeInspection.scheduledAt
      ? this.transloco.translate('devices.inspections.nextInspection', {
          date: this.formatDateTime(activeInspection.scheduledAt),
        })
      : this.transloco.translate('devices.inspections.enabledNoDate');
  }
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest('a, button'));
}
