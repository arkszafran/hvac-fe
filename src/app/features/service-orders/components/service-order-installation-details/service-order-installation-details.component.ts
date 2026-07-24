import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { InstallationServiceOrderData } from '../../models/service-order.model';
import {
  getServiceOrderBuildingTypeLabel,
  getServiceOrderOutdoorUnitPlaceLabel,
} from '../../utils/service-order-ui.util';

@Component({
  selector: 'app-service-order-installation-details',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-order-installation-details.component.html',
})
export class ServiceOrderInstallationDetailsComponent {
  private readonly transloco = inject(TranslocoService);

  readonly data = input.required<InstallationServiceOrderData>();

  protected buildingTypeLabel(): string {
    return getServiceOrderBuildingTypeLabel(this.data().buildingType, this.transloco);
  }

  protected outdoorUnitPlaceLabel(
    place: InstallationServiceOrderData['rooms'][number]['outdoorUnitPlace'],
  ): string {
    return getServiceOrderOutdoorUnitPlaceLabel(place, this.transloco);
  }
}
