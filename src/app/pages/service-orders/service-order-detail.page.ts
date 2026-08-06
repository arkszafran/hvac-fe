import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ServiceOrderDetailPanelComponent } from '../../features/service-orders/components/service-order-detail-panel/service-order-detail-panel.component';

@Component({
  selector: 'app-service-order-detail-page',
  imports: [ServiceOrderDetailPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-order-detail.page.html',
})
export class ServiceOrderDetailPageComponent {}
