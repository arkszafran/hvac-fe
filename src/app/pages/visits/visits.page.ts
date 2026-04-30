import { ChangeDetectionStrategy, Component } from '@angular/core';

import { VisitsViewComponent } from '../../features/visits/components/visits-view/visits-view.component';

@Component({
  selector: 'app-visits-page',
  standalone: true,
  imports: [VisitsViewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <app-visits-view /> `,
})
export class VisitsPageComponent {}
