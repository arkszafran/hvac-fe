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
  UiSelectComponent,
  UiSelectOption,
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
import {
  ServiceOrderDateFilter,
  matchesServiceOrderDateFilter,
} from '../../utils/service-order-date-filter.util';
import { ServiceOrderScheduleModalComponent } from '../service-order-schedule-modal/service-order-schedule-modal.component';
import { ServiceOrderTableComponent } from '../service-order-table/service-order-table.component';

const DEFAULT_STATUS_FILTERS: ServiceOrderStatus[] = ['contact_required', 'scheduled'];
const DEFAULT_TYPE_FILTERS: ServiceOrderType[] = ['installation', 'repair', 'inspection'];
const DEFAULT_DATE_FILTER: ServiceOrderDateFilter = 'today';

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
    UiSelectComponent,
    ServiceOrderScheduleModalComponent,
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
  protected readonly dateControl = new FormControl<ServiceOrderDateFilter>(DEFAULT_DATE_FILTER, {
    nonNullable: true,
  });
  protected readonly orderPendingCancellation = signal<ServiceOrder | null>(null);
  protected readonly orderBeingScheduled = signal<ServiceOrder | null>(null);
  protected readonly statusControl = new FormControl<ServiceOrderStatus[]>(DEFAULT_STATUS_FILTERS, {
    nonNullable: true,
  });
  protected readonly typeControl = new FormControl<ServiceOrderType[]>(DEFAULT_TYPE_FILTERS, {
    nonNullable: true,
  });
  private readonly searchQuery = toSignal(this.searchControl.valueChanges, { initialValue: '' });
  private readonly dateFilter = toSignal(this.dateControl.valueChanges, {
    initialValue: DEFAULT_DATE_FILTER,
  });
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
  protected readonly dateOptions = computed<UiSelectOption[]>(() => {
    this.activeLanguage();

    return (['today', 'tomorrow', 'this_week', 'all'] as const).map((filter) => ({
      value: filter,
      label: this.transloco.translate(`serviceOrders.dateFilters.${filter}`),
    }));
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
    const date = this.dateFilter();
    const status = this.statusFilter();
    const type = this.typeFilter();

    return this.store.orders().filter((order) => {
      if (!status.includes(order.status)) {
        return false;
      }

      if (!type.includes(order.type)) {
        return false;
      }

      if (!matchesServiceOrderDateFilter(order, date)) {
        return false;
      }

      return (
        !query ||
        normalizeValue(
          [
            order.companyName,
            order.fullName,
            order.phone,
            order.email,
            order.address,
            order.city,
          ].join(' '),
        ).includes(query)
      );
    });
  });
  protected openDetails(order: ServiceOrder): void {
    void this.router.navigate(['/service-orders', order.id], {
      state: { fromServiceOrderList: true },
    });
  }

  protected openSchedule(order: ServiceOrder): void {
    this.orderBeingScheduled.set(order);
  }

  protected closeScheduleModal(): void {
    this.orderBeingScheduled.set(null);
  }

  protected saveSchedule(scheduledAt: string): void {
    const order = this.orderBeingScheduled();

    if (!order) {
      return;
    }

    this.store.scheduleOrder(order.id, scheduledAt);
    this.closeScheduleModal();
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
