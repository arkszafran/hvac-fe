import { ChangeDetectionStrategy, Component } from '@angular/core';

import { DeviceDetailViewComponent } from '../../features/customers/device-detail-view.component';

@Component({
  selector: 'app-device-detail-page',
  imports: [DeviceDetailViewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './device-detail.page.html',
})
export class DeviceDetailPageComponent {}
