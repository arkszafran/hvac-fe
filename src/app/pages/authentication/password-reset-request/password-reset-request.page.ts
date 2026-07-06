import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PasswordResetRequestViewComponent } from '../../../features/authentication/password-reset-request-view/password-reset-request-view.component';

@Component({
  selector: 'app-password-reset-request-page',
  imports: [PasswordResetRequestViewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './password-reset-request.page.html',
})
export class PasswordResetRequestPageComponent {}
