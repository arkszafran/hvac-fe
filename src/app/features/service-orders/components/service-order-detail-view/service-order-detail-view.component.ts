import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { map } from 'rxjs';

import { UserListItemDto } from '../../../../common/api/users';
import {
  UiBadgeComponent,
  UiButtonComponent,
  UiCardComponent,
  UiEmptyStateComponent,
  UiModalComponent,
} from '../../../../ui';
import { VisitsStore } from '../../../visits/data/visits.store';
import { ServiceOrdersStore } from '../../data/service-orders.store';
import { ServiceOrder } from '../../models/service-order.model';
import {
  formatServiceOrderCustomerAddress,
  formatServiceOrderCustomerName,
  formatServiceOrderDate,
  formatServiceOrderNextActionDateTime,
  getServiceOrderSourceLabel,
  getServiceOrderStatusLabel,
  getServiceOrderStatusVariant,
  getServiceOrderTypeLabel,
  getServiceOrderTypeVariant,
  serviceOrderMapHref,
  serviceOrderPhoneHref,
} from '../../utils/service-order-ui.util';
import { ServiceOrderInspectionDetailsComponent } from '../service-order-inspection-details/service-order-inspection-details.component';
import { ServiceOrderInstallationDetailsComponent } from '../service-order-installation-details/service-order-installation-details.component';
import { ServiceOrderActionsMenuComponent } from '../service-order-actions-menu/service-order-actions-menu.component';
import { ServiceOrderAssigneeModalComponent } from '../service-order-assignee-modal/service-order-assignee-modal.component';
import {
  ServiceOrderNextContactFormValue,
  ServiceOrderNextContactModalComponent,
} from '../service-order-next-contact-modal/service-order-next-contact-modal.component';
import { ServiceOrderNoteModalComponent } from '../service-order-note-modal/service-order-note-modal.component';
import { ServiceOrderRepairDetailsComponent } from '../service-order-repair-details/service-order-repair-details.component';
import { ServiceOrderScheduleModalComponent } from '../service-order-schedule-modal/service-order-schedule-modal.component';

@Component({
  selector: 'app-service-order-detail-view',
  imports: [
    TranslocoPipe,
    UiBadgeComponent,
    UiButtonComponent,
    UiCardComponent,
    UiEmptyStateComponent,
    UiModalComponent,
    ServiceOrderActionsMenuComponent,
    ServiceOrderAssigneeModalComponent,
    ServiceOrderInspectionDetailsComponent,
    ServiceOrderInstallationDetailsComponent,
    ServiceOrderNextContactModalComponent,
    ServiceOrderNoteModalComponent,
    ServiceOrderRepairDetailsComponent,
    ServiceOrderScheduleModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-order-detail-view.component.html',
})
export class ServiceOrderDetailViewComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(ServiceOrdersStore);
  private readonly visitsStore = inject(VisitsStore);
  private readonly transloco = inject(TranslocoService);
  private readonly activeLanguage = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  readonly closeRequested = output<void>();

  protected readonly isScheduleModalOpen = signal(
    this.route.snapshot.queryParamMap.get('action') === 'schedule',
  );
  protected readonly isAssigneeModalOpen = signal(false);
  protected readonly isCancellationModalOpen = signal(false);
  protected readonly isNextContactModalOpen = signal(false);
  protected readonly isNoteModalOpen = signal(false);
  protected readonly orderId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('serviceOrderId') ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('serviceOrderId') ?? '' },
  );
  protected readonly details = computed(() => this.store.getOrderDetailsById(this.orderId()));
  protected readonly relatedVisits = computed(() =>
    this.visitsStore.visits().filter((visit) => visit.serviceOrderId === this.orderId()),
  );

  protected readonly formatCustomerName = formatServiceOrderCustomerName;
  protected readonly formatCustomerAddress = formatServiceOrderCustomerAddress;
  protected readonly getStatusVariant = getServiceOrderStatusVariant;
  protected readonly getTypeVariant = getServiceOrderTypeVariant;
  protected readonly mapHref = serviceOrderMapHref;
  protected readonly phoneHref = serviceOrderPhoneHref;

  protected getTypeLabel(order: ServiceOrder): string {
    this.activeLanguage();
    return getServiceOrderTypeLabel(order.type, this.transloco);
  }

  protected getStatusLabel(order: ServiceOrder): string {
    this.activeLanguage();
    return getServiceOrderStatusLabel(order.status, this.transloco);
  }

  protected getSourceLabel(order: ServiceOrder): string {
    this.activeLanguage();
    return getServiceOrderSourceLabel(order.source, this.transloco);
  }

  protected formatDate(value: string): string {
    this.activeLanguage();
    return formatServiceOrderDate(value, this.transloco.getActiveLang());
  }

  protected formatNextActionDate(value: string): string {
    this.activeLanguage();
    const formatted = formatServiceOrderNextActionDateTime(value, this.transloco.getActiveLang());
    const date = formatted.isToday
      ? this.transloco.translate('serviceOrders.nextAction.today')
      : formatted.date;

    return `${date}, ${formatted.time}`;
  }

  protected confirmationLabelKey(order: ServiceOrder): string {
    if (order.serviceData.type !== 'inspection' || order.source !== 'system') {
      return '';
    }

    return order.serviceData.customerConfirmationStatus === 'confirmed'
      ? 'serviceOrders.confirmation.confirmed'
      : 'serviceOrders.confirmation.notConfirmed';
  }

  protected canChangeOrder(order: ServiceOrder): boolean {
    return order.status !== 'completed' && order.status !== 'cancelled';
  }

  protected openSchedule(): void {
    this.isScheduleModalOpen.set(true);
  }

  protected closeSchedule(): void {
    this.isScheduleModalOpen.set(false);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true,
    });
  }

  protected saveSchedule(scheduledAt: string): void {
    this.store.scheduleOrder(this.orderId(), scheduledAt);
    this.closeSchedule();
  }

  protected openNote(): void {
    this.isNoteModalOpen.set(true);
  }

  protected saveNote(content: string): void {
    this.store.addNote(this.orderId(), content);
    this.isNoteModalOpen.set(false);
  }

  protected saveNextContact(value: ServiceOrderNextContactFormValue): void {
    this.store.scheduleNextContact(this.orderId(), value.nextContactAt, value.note);
    this.isNextContactModalOpen.set(false);
  }

  protected assignUser(user: UserListItemDto): void {
    this.store.assignAssignee(this.orderId(), user.id, {
      name: user.name,
      email: user.email,
    });
    this.isAssigneeModalOpen.set(false);
  }

  protected createVisit(): void {
    void this.router.navigate(['/visits/new'], {
      queryParams: { serviceOrderId: this.orderId() },
    });
  }

  protected confirmCancellation(): void {
    this.store.cancelOrder(this.orderId());
    this.isCancellationModalOpen.set(false);
  }

  protected backToList(): void {
    this.closeRequested.emit();
  }
}
