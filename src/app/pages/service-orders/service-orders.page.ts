import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ServiceOrdersViewComponent } from '../../features/service-orders/components/service-orders-view/service-orders-view.component';

@Component({
  selector: 'app-service-orders-page',
  imports: [ServiceOrdersViewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-orders.page.html',
})
export class ServiceOrdersPageComponent {}
