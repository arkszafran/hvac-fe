import { ChangeDetectionStrategy, Component } from '@angular/core';

import { InspectionDetailViewComponent } from '../../features/inspections/inspection-detail-view.component';

@Component({
  selector: 'app-inspection-detail-page',
  standalone: true,
  imports: [InspectionDetailViewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <app-inspection-detail-view /> `,
})
export class InspectionDetailPageComponent {}
