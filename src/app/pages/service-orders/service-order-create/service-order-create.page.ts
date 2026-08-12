import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ServiceOrderCreateViewComponent } from '../../../features/service-orders/components/service-order-create-view/service-order-create-view.component';

@Component({
  selector: 'app-service-order-create-page',
  imports: [ServiceOrderCreateViewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-order-create.page.html',
})
export class ServiceOrderCreatePageComponent {}
