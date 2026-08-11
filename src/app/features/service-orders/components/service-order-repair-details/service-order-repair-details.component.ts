import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { RepairServiceOrderData } from '../../models/service-order.model';
import { ServiceOrderDeviceDetailsComponent } from '../service-order-device-details/service-order-device-details.component';

@Component({
  selector: 'app-service-order-repair-details',
  imports: [TranslocoPipe, ServiceOrderDeviceDetailsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-order-repair-details.component.html',
})
export class ServiceOrderRepairDetailsComponent {
  readonly data = input.required<RepairServiceOrderData>();
}
