import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ServiceOrdersViewComponent } from '../../features/service-orders/components/service-orders-view/service-orders-view.component';

@Component({
  selector: 'app-service-orders-page',
  imports: [RouterOutlet, ServiceOrdersViewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-orders.page.html',
})
export class ServiceOrdersPageComponent {
  protected readonly isDetailPanelOpen = signal(false);

  protected handleDetailPanelActivation(): void {
    this.isDetailPanelOpen.set(true);
  }

  protected handleDetailPanelDeactivation(): void {
    this.isDetailPanelOpen.set(false);
  }
}
