import { ChangeDetectionStrategy, Component } from '@angular/core';

import { LoginViewComponent } from '../../features/login/login-view/login-view.component';

@Component({
  selector: 'app-login-page',
  imports: [LoginViewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.page.html',
})
export class LoginPageComponent {}
