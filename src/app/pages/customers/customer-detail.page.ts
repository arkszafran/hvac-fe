import { ChangeDetectionStrategy, Component } from '@angular/core';

import { CustomerDetailViewComponent } from '../../features/customers/customer-detail-view.component';

@Component({
  selector: 'app-customer-detail-page',
  imports: [CustomerDetailViewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './customer-detail.page.html',
})
export class CustomerDetailPageComponent {}
