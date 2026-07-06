import { ChangeDetectionStrategy, Component } from '@angular/core';

import { SetupInitialCredentialsViewComponent } from '../../../features/authentication/setup-initial-credentials-view/setup-initial-credentials-view.component';

@Component({
  selector: 'app-setup-new-credentials-page',
  imports: [SetupInitialCredentialsViewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './setup-new-credentials.page.html',
})
export class SetupNewCredentialsPageComponent {}
