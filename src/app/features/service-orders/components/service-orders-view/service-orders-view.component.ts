import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import {
  UiButtonComponent,
  UiCardComponent,
  UiInputComponent,
  UiModalComponent,
  UiMultiselectComponent,
  UiMultiselectOption,
} from '../../../../ui';
import { ServiceOrdersStore } from '../../data/service-orders.store';
import {
  ServiceOrder,
  ServiceOrderStatus,
  ServiceOrderType,
} from '../../models/service-order.model';
import {
  getServiceOrderStatusLabel,
  getServiceOrderTypeLabel,
} from '../../utils/service-order-ui.util';
import { ServiceOrderTableComponent } from '../service-order-table/service-order-table.component';

const DEFAULT_STATUS_FILTERS: ServiceOrderStatus[] = ['contact_required', 'scheduled'];
const DEFAULT_TYPE_FILTERS: ServiceOrderType[] = ['installation', 'repair', 'inspection'];

@Component({
  selector: 'app-service-orders-view',
  imports: [
    ReactiveFormsModule,
    TranslocoPipe,
    UiButtonComponent,
    UiCardComponent,
    UiInputComponent,
    UiModalComponent,
    UiMultiselectComponent,
    ServiceOrderTableComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-orders-view.component.html',
})
export class ServiceOrdersViewComponent {
  private readonly router = inject(Router);
  private readonly store = inject(ServiceOrdersStore);
  private readonly transloco = inject(TranslocoService);
  private readonly activeLanguage = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly orderPendingCancellation = signal<ServiceOrder | null>(null);
  protected readonly statusControl = new FormControl<ServiceOrderStatus[]>(DEFAULT_STATUS_FILTERS, {
    nonNullable: true,
  });
  protected readonly typeControl = new FormControl<ServiceOrderType[]>(DEFAULT_TYPE_FILTERS, {
    nonNullable: true,
  });
  private readonly searchQuery = toSignal(this.searchControl.valueChanges, { initialValue: '' });
  private readonly statusFilter = toSignal(this.statusControl.valueChanges, {
    initialValue: DEFAULT_STATUS_FILTERS,
  });
  private readonly typeFilter = toSignal(this.typeControl.valueChanges, {
    initialValue: DEFAULT_TYPE_FILTERS,
  });

  protected readonly statusOptions = computed<UiMultiselectOption[]>(() => {
    this.activeLanguage();

    return (['new', 'contact_required', 'scheduled', 'completed', 'cancelled'] as const).map(
      (status) => ({
        value: status,
        label: getServiceOrderStatusLabel(status, this.transloco),
      }),
    );
  });
  protected readonly typeOptions = computed<UiMultiselectOption[]>(() => {
    this.activeLanguage();

    return DEFAULT_TYPE_FILTERS.map((type) => ({
      value: type,
      label: getServiceOrderTypeLabel(type, this.transloco),
    }));
  });
  protected readonly filteredOrders = computed(() => {
    const query = normalizeValue(this.searchQuery());
    const status = this.statusFilter();
    const type = this.typeFilter();

    return this.store.orders().filter((order) => {
      if (!status.includes(order.status)) {
        return false;
      }

      if (!type.includes(order.type)) {
        return false;
      }

      return (
        !query ||
        normalizeValue(
          [
            order.customer.companyName,
            order.customer.fullName,
            order.customer.phone,
            order.customer.email,
            order.customer.address,
            order.customer.city,
          ].join(' '),
        ).includes(query)
      );
    });
  });
  protected openDetails(order: ServiceOrder): void {
    void this.router.navigate(['/service-orders', order.id]);
  }

  protected openSchedule(order: ServiceOrder): void {
    void this.router.navigate(['/service-orders', order.id], {
      queryParams: { action: 'schedule' },
    });
  }

  protected createVisit(order: ServiceOrder): void {
    void this.router.navigate(['/visits/new'], { queryParams: { serviceOrderId: order.id } });
  }

  protected requestCancellation(order: ServiceOrder): void {
    this.orderPendingCancellation.set(order);
  }

  protected closeCancellationModal(): void {
    this.orderPendingCancellation.set(null);
  }

  protected confirmCancellation(): void {
    const order = this.orderPendingCancellation();

    if (!order) {
      return;
    }

    this.store.cancelOrder(order.id);
    this.closeCancellationModal();
  }
}

function normalizeValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
