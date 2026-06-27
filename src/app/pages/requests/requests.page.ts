import { ChangeDetectionStrategy, Component } from '@angular/core';

import { RequestsViewComponent } from '../../features/requests/requests-view/requests-view.component';

@Component({
  selector: 'app-requests-page',
  imports: [RequestsViewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './requests.page.html',
})
export class RequestsPageComponent {}
