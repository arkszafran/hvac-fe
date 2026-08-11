import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { UiBadgeComponent } from '../../../../ui';
import { UiMapPinIconComponent } from '../../../../ui/map-pin-icon/map-pin-icon.component';
import type { Customer } from '../../../customers/models/customer.model';
import type { ServiceOrder } from '../../models/service-order.model';
import {
  formatServiceOrderCustomerAddress,
  formatServiceOrderCustomerName,
  serviceOrderMapHref,
} from '../../utils/service-order-ui.util';

@Component({
  selector: 'app-service-order-customer-links',
  imports: [RouterLink, TranslocoPipe, UiBadgeComponent, UiMapPinIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-order-customer-links.component.html',
  host: {
    class: 'block min-w-0',
  },
})
export class ServiceOrderCustomerLinksComponent {
  readonly order = input.required<ServiceOrder>();
  readonly systemCustomer = input<Customer>();

  protected readonly customerName = computed(() => formatServiceOrderCustomerName(this.order()));
  protected readonly customerAddress = computed(() =>
    formatServiceOrderCustomerAddress(this.order()),
  );
  protected readonly mapHref = computed(() => serviceOrderMapHref(this.order()));
}
