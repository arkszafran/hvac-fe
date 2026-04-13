import { ChangeDetectionStrategy, Component } from '@angular/core';

import { DeviceCreateViewComponent } from '../../features/devices/device-create-view.component';

@Component({
  selector: 'app-device-create-page',
  standalone: true,
  imports: [DeviceCreateViewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <app-device-create-view /> `,
})
export class DeviceCreatePageComponent {}
