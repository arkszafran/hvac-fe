import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { RepairServiceOrderData, ServiceOrderDevice } from '../../models/service-order.model';

@Component({
  selector: 'app-service-order-repair-details',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-order-repair-details.component.html',
})
export class ServiceOrderRepairDetailsComponent {
  readonly data = input.required<RepairServiceOrderData>();

  protected deviceName(device: ServiceOrderDevice): string {
    return `${device.brand} ${device.model}`.trim() || '--';
  }
}
