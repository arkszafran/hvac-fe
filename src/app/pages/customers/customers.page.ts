import { ChangeDetectionStrategy, Component } from '@angular/core';

import { CustomersViewComponent } from '../../features/customers/customers-view.component';

@Component({
  selector: 'app-customers-page',
  standalone: true,
  imports: [CustomersViewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <app-customers-view /> `,
})
export class CustomersPageComponent {}
