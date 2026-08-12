import { ChangeDetectionStrategy, Component } from '@angular/core';

import { DevicesViewComponent } from '../../features/devices/devices-view.component';

@Component({
  selector: 'app-devices-page',
  imports: [DevicesViewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './devices.page.html',
})
export class DevicesPageComponent {}
