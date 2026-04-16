import { ChangeDetectionStrategy, Component } from '@angular/core';

import { DeviceDetailViewComponent } from '../../features/devices/device-detail-view.component';

@Component({
  selector: 'app-device-detail-page',
  standalone: true,
  imports: [DeviceDetailViewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <app-device-detail-view /> `,
})
export class DeviceDetailPageComponent {}
