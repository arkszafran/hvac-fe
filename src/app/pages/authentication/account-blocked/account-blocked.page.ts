import { ChangeDetectionStrategy, Component } from '@angular/core';

import { AccountBlockedViewComponent } from '../../../features/authentication/account-blocked-view/account-blocked-view.component';

@Component({
  selector: 'app-account-blocked-page',
  imports: [AccountBlockedViewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './account-blocked.page.html',
})
export class AccountBlockedPageComponent {}
