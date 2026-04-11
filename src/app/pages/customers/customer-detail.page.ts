import { ChangeDetectionStrategy, Component } from '@angular/core';

import { CustomerDetailViewComponent } from '../../features/customers/customer-detail-view.component';

@Component({
  selector: 'app-customer-detail-page',
  standalone: true,
  imports: [CustomerDetailViewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <app-customer-detail-view /> `,
})
export class CustomerDetailPageComponent {}
