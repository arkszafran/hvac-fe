import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { UiBadgeComponent } from '../../../../ui';
import { Device } from '../../../customers/models/device.model';
import { InspectionServiceOrderData, ServiceOrderDevice } from '../../models/service-order.model';

@Component({
  selector: 'app-service-order-inspection-details',
  imports: [TranslocoPipe, UiBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-order-inspection-details.component.html',
})
export class ServiceOrderInspectionDetailsComponent {
  readonly data = input.required<InspectionServiceOrderData>();
  readonly systemDevices = input<Device[]>([]);

  protected deviceName(device: Device | ServiceOrderDevice): string {
    return `${device.brand} ${device.model}`.trim() || '--';
  }
}
