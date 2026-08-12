import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { UserListItemDto } from '../../../../common/api/users';
import {
  UiButtonComponent,
  UiDrawerComponent,
  UiIconComponent,
  UiInputComponent,
  UiModalComponent,
  UiMultiselectComponent,
  UiMultiselectOption,
  UiSelectComponent,
  UiSelectOption,
} from '../../../../ui';
import { classNames } from '../../../../ui/utils/classnames';
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
import { ServiceOrderAssigneeModalComponent } from '../service-order-assignee-modal/service-order-assignee-modal.component';
import {
  ServiceOrderNextContactFormValue,
  ServiceOrderNextContactModalComponent,
} from '../service-order-next-contact-modal/service-order-next-contact-modal.component';
import { ServiceOrderNoteModalComponent } from '../service-order-note-modal/service-order-note-modal.component';
import { ServiceOrderTableComponent } from '../service-order-table/service-order-table.component';

const DEFAULT_STATUS_FILTERS: ServiceOrderStatus[] = ['contact_required', 'scheduled'];
const DEFAULT_TYPE_FILTERS: ServiceOrderType[] = ['installation', 'repair', 'inspection'];
const DEFAULT_DATE_FILTER: ServiceOrderDateFilter = 'today';

interface ServiceOrderScheduleModalState {
  order: ServiceOrder;
  titleKey: string;
}

@Component({
  selector: 'app-service-orders-view',
  imports: [
    ReactiveFormsModule,
    TranslocoPipe,
    UiButtonComponent,
    UiDrawerComponent,
    UiIconComponent,
    UiInputComponent,
    UiModalComponent,
    UiMultiselectComponent,
    UiSelectComponent,
    ServiceOrderScheduleModalComponent,
    ServiceOrderAssigneeModalComponent,
    ServiceOrderNextContactModalComponent,
    ServiceOrderNoteModalComponent,
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
  protected readonly scheduleModalState = signal<ServiceOrderScheduleModalState | null>(null);
  protected readonly orderForNextContact = signal<ServiceOrder | null>(null);
  protected readonly orderForNote = signal<ServiceOrder | null>(null);
  protected readonly orderForAssignee = signal<ServiceOrder | null>(null);
  protected readonly isMobileFiltersOpen = signal(false);
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
  protected readonly statusSelectionLabel = computed(() => {
    this.activeLanguage();
    const selectedStatuses = this.statusFilter();

    return hasSameValues(selectedStatuses, DEFAULT_STATUS_FILTERS)
      ? this.transloco.translate('serviceOrders.filters.open')
      : '';
  });
  protected readonly filteredOrders = computed(() => this.filterOrders(this.dateFilter()));
  protected readonly todayOrderCount = computed(() => this.filterOrders('today').length);

  protected selectDateFilter(filter: ServiceOrderDateFilter): void {
    this.dateControl.setValue(filter);
  }

  protected dateFilterChipClasses(filter: ServiceOrderDateFilter): string {
    return classNames(
      'ui-focus-ring inline-flex min-h-11 shrink-0 items-center justify-center rounded-full px-3.5 text-small transition-colors duration-200 motion-reduce:transition-none',
      this.dateFilter() === filter
        ? 'bg-brand font-semibold text-white'
        : 'bg-surface-muted text-text-main hover:bg-action-soft',
    );
  }

  private filterOrders(date: ServiceOrderDateFilter) {
    const query = normalizeValue(this.searchQuery());
    const status = this.statusFilter();
    const type = this.typeFilter();

    return this.store.orderDetails().filter(({ order }) => {
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
            order.assignee?.name ?? '',
            order.assignee?.email ?? '',
          ].join(' '),
        ).includes(query)
      );
    });
  }
  protected openDetails(order: ServiceOrder): void {
    void this.router.navigate(['/service-orders', order.id]);
  }

  protected openSchedule(order: ServiceOrder): void {
    this.scheduleModalState.set({
      order,
      titleKey: 'serviceOrders.scheduleModal.title',
    });
  }

  protected openDateConfirmation(order: ServiceOrder): void {
    this.scheduleModalState.set({
      order,
      titleKey: 'serviceOrders.confirmation.confirmDate',
    });
  }

  protected closeScheduleModal(): void {
    this.scheduleModalState.set(null);
  }

  protected saveSchedule(scheduledAt: string): void {
    const state = this.scheduleModalState();

    if (!state) {
      return;
    }

    this.store.scheduleOrder(state.order.id, scheduledAt);
    this.closeScheduleModal();
  }

  protected createVisit(order: ServiceOrder): void {
    void this.router.navigate(['/visits/new'], { queryParams: { serviceOrderId: order.id } });
  }

  protected openNextContact(order: ServiceOrder): void {
    this.orderForNextContact.set(order);
  }

  protected saveNextContact(value: ServiceOrderNextContactFormValue): void {
    const order = this.orderForNextContact();

    if (!order) {
      return;
    }

    this.store.scheduleNextContact(order.id, value.nextContactAt, value.note);
    this.orderForNextContact.set(null);
  }

  protected openNote(order: ServiceOrder): void {
    this.orderForNote.set(order);
  }

  protected saveNote(content: string): void {
    const order = this.orderForNote();

    if (!order) {
      return;
    }

    this.store.addNote(order.id, content);
    this.orderForNote.set(null);
  }

  protected openAssignee(order: ServiceOrder): void {
    this.orderForAssignee.set(order);
  }

  protected assignUser(user: UserListItemDto): void {
    const order = this.orderForAssignee();

    if (!order) {
      return;
    }

    this.store.assignAssignee(order.id, user.id, { name: user.name, email: user.email });
    this.orderForAssignee.set(null);
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

function hasSameValues<T>(left: readonly T[], right: readonly T[]): boolean {
  return left.length === right.length && left.every((value) => right.includes(value));
}
