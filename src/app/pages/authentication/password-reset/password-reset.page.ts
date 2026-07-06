import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PasswordResetViewComponent } from '../../../features/authentication/password-reset-view/password-reset-view.component';

@Component({
  selector: 'app-password-reset-page',
  imports: [PasswordResetViewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './password-reset.page.html',
})
export class PasswordResetPageComponent {}
