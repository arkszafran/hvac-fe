import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { Device, getDeviceTypeLabel } from '../../../customers/models/device.model';
import { ServiceOrderDevice } from '../../models/service-order.model';

@Component({
  selector: 'app-service-order-device-details',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-order-device-details.component.html',
})
export class ServiceOrderDeviceDetailsComponent {
  private readonly transloco = inject(TranslocoService);
  private readonly activeLanguage = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  readonly device = input.required<Device | ServiceOrderDevice>();
  readonly index = input.required<number>();

  protected readonly displayedError = computed(() => {
    const device = this.device();

    return 'displayedError' in device ? device.displayedError : undefined;
  });
  protected readonly nameplatePhotos = computed(() => {
    const device = this.device();

    return 'nameplatePhotos' in device ? (device.nameplatePhotos ?? []) : [];
  });
  protected readonly hasPhotoSection = computed(() => 'nameplatePhotos' in this.device());

  protected deviceName(): string {
    const device = this.device();

    return `${device.brand} ${device.model}`.trim() || '--';
  }

  protected deviceTypeLabel(): string {
    this.activeLanguage();
    return getDeviceTypeLabel(this.device().type, this.transloco);
  }
}
