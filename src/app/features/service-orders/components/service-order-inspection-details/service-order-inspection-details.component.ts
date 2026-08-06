import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { Device } from '../../../customers/models/device.model';
import { InspectionServiceOrderData } from '../../models/service-order.model';
import { ServiceOrderDeviceDetailsComponent } from '../service-order-device-details/service-order-device-details.component';

@Component({
  selector: 'app-service-order-inspection-details',
  imports: [TranslocoPipe, ServiceOrderDeviceDetailsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-order-inspection-details.component.html',
})
export class ServiceOrderInspectionDetailsComponent {
  readonly data = input.required<InspectionServiceOrderData>();
  readonly systemDevices = input<Device[]>([]);
}
