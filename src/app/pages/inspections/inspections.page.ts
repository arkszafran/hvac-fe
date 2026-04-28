import { ChangeDetectionStrategy, Component } from '@angular/core';

import { InspectionsViewComponent } from '../../features/inspections/inspections-view.component';

@Component({
  selector: 'app-inspections-page',
  standalone: true,
  imports: [InspectionsViewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <app-inspections-view /> `,
})
export class InspectionsPageComponent {}
