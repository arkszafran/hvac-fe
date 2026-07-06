import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PinLoginViewComponent } from '../../../features/authentication/pin-login-view/pin-login-view.component';

@Component({
  selector: 'app-pin-login-page',
  imports: [PinLoginViewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pin-login.page.html',
})
export class PinLoginPageComponent {}
