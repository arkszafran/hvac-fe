import { ChangeDetectionStrategy, Component } from '@angular/core';

import { VisitCreateViewComponent } from '../../features/visits/components/visit-create-view/visit-create-view.component';

@Component({
  selector: 'app-visit-create-page',
  standalone: true,
  imports: [VisitCreateViewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <app-visit-create-view /> `,
})
export class VisitCreatePageComponent {}
