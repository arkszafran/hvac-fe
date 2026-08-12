import { ChangeDetectionStrategy, Component } from '@angular/core';

import { DeviceCreateViewComponent } from '../../features/devices/device-create-view.component';

@Component({
  selector: 'app-device-create-page',
  imports: [DeviceCreateViewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './device-create.page.html',
})
export class DeviceCreatePageComponent {}
