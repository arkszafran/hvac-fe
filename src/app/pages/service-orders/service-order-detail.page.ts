import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ServiceOrderDetailViewComponent } from '../../features/service-orders/components/service-order-detail-view/service-order-detail-view.component';

@Component({
  selector: 'app-service-order-detail-page',
  imports: [ServiceOrderDetailViewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-order-detail.page.html',
})
export class ServiceOrderDetailPageComponent {}
