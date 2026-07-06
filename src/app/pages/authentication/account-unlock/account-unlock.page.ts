import { ChangeDetectionStrategy, Component } from '@angular/core';

import { AccountUnlockViewComponent } from '../../../features/authentication/account-unlock-view/account-unlock-view.component';

@Component({
  selector: 'app-account-unlock-page',
  imports: [AccountUnlockViewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './account-unlock.page.html',
})
export class AccountUnlockPageComponent {}
