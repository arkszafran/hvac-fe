import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { UiFullscreenPanelComponent } from '../../../../ui';
import { ServiceOrderDetailViewComponent } from '../service-order-detail-view/service-order-detail-view.component';

@Component({
  selector: 'app-service-order-detail-panel',
  imports: [TranslocoPipe, UiFullscreenPanelComponent, ServiceOrderDetailViewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-order-detail-panel.component.html',
})
export class ServiceOrderDetailPanelComponent {
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly wasOpenedFromList = isListNavigationState(this.location.getState());

  protected closePanel(): void {
    if (this.wasOpenedFromList) {
      this.location.back();
      return;
    }

    void this.router.navigate(['/service-orders'], { replaceUrl: true });
  }
}

function isListNavigationState(state: unknown): boolean {
  if (typeof state !== 'object' || state === null) {
    return false;
  }

  return (state as Record<string, unknown>)['fromServiceOrderList'] === true;
}
