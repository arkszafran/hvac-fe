import { ChangeDetectionStrategy, Component } from '@angular/core';

import { AutoLoginViewComponent } from '../../../features/authentication/auto-login-view/auto-login-view.component';

@Component({
  selector: 'app-auto-login-page',
  imports: [AutoLoginViewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './auto-login.page.html',
})
export class AutoLoginPageComponent {}
