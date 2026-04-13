import { ChangeDetectionStrategy, Component } from '@angular/core';

import { DevicesViewComponent } from '../../features/devices/devices-view.component';

@Component({
  selector: 'app-devices-page',
  standalone: true,
  imports: [DevicesViewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <app-devices-view /> `,
})
export class DevicesPageComponent {}
