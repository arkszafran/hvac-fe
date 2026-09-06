import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { map } from 'rxjs';

import { UserListItemDto } from '../../../../common/api/users';
import {
  UiBadgeComponent,
  UiButtonComponent,
  UiEmptyStateComponent,
  UiIconComponent,
  UiModalComponent,
  UiPhotoGalleryComponent,
} from '../../../../ui';
import { UiMapPinIconComponent } from '../../../../ui/map-pin-icon/map-pin-icon.component';
import { classNames } from '../../../../ui/utils/classnames';
import { VisitsStore } from '../../../visits/data/visits.store';
import { ServiceOrdersStore } from '../../data/service-orders.store';
import { ServiceOrder } from '../../models/service-order.model';
import {
  formatServiceOrderCustomerAddress,
  formatServiceOrderCustomerName,
  formatServiceOrderDate,
  formatServiceOrderNextActionDateTime,
  getServiceOrderInspectionConfirmation,
  getServiceOrderSourceLabel,
  getServiceOrderStatusLabel,
  getServiceOrderStatusVariant,
  getServiceOrderTypeLabel,
  serviceOrderMapHref,
  serviceOrderPhoneHref,
} from '../../utils/service-order-ui.util';
import { ServiceOrderInspectionDetailsComponent } from '../service-order-inspection-details/service-order-inspection-details.component';
import { ServiceOrderInspectionConfirmationComponent } from '../service-order-inspection-confirmation/service-order-inspection-confirmation.component';
import { ServiceOrderInstallationDetailsComponent } from '../service-order-installation-details/service-order-installation-details.component';
import { ServiceOrderActionsMenuComponent } from '../service-order-actions-menu/service-order-actions-menu.component';
import { ServiceOrderAssigneeModalComponent } from '../service-order-assignee-modal/service-order-assignee-modal.component';
import {
  ServiceOrderNextContactFormValue,
  ServiceOrderNextContactModalComponent,
} from '../service-order-next-contact-modal/service-order-next-contact-modal.component';
import {
  ServiceOrderNoteFormValue,
  ServiceOrderNoteModalComponent,
} from '../service-order-note-modal/service-order-note-modal.component';
import { ServiceOrderRepairDetailsComponent } from '../service-order-repair-details/service-order-repair-details.component';
import { ServiceOrderScheduleModalComponent } from '../service-order-schedule-modal/service-order-schedule-modal.component';

@Component({
  selector: 'app-service-order-detail-view',
  imports: [
    TranslocoPipe,
    RouterLink,
    UiBadgeComponent,
    UiButtonComponent,
    UiEmptyStateComponent,
    UiIconComponent,
    UiMapPinIconComponent,
    UiModalComponent,
    UiPhotoGalleryComponent,
    ServiceOrderActionsMenuComponent,
    ServiceOrderAssigneeModalComponent,
    ServiceOrderInspectionDetailsComponent,
    ServiceOrderInspectionConfirmationComponent,
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
  protected readonly returnCustomerId = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('returnCustomerId') ?? '')),
    { initialValue: this.route.snapshot.queryParamMap.get('returnCustomerId') ?? '' },
  );
  protected readonly backLabelKey = computed(() =>
    this.returnCustomerId()
      ? 'serviceOrders.details.backToCustomer'
      : 'serviceOrders.details.backToList',
  );
  protected readonly details = computed(() => this.store.getOrderDetailsById(this.orderId()));
  protected readonly relatedVisits = computed(() =>
    this.visitsStore.visits().filter((visit) => visit.serviceOrderId === this.orderId()),
  );

  protected readonly formatCustomerName = formatServiceOrderCustomerName;
  protected readonly formatCustomerAddress = formatServiceOrderCustomerAddress;
  protected readonly getStatusVariant = getServiceOrderStatusVariant;
  protected readonly mapHref = serviceOrderMapHref;
  protected readonly phoneHref = serviceOrderPhoneHref;
  protected readonly inspectionConfirmation = getServiceOrderInspectionConfirmation;

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

  protected nextActionLabelKey(order: ServiceOrder): string {
    if (order.status === 'scheduled') {
      return 'serviceOrders.nextAction.visitCustomer';
    }

    if (order.status === 'new' || order.status === 'contact_required') {
      return 'serviceOrders.nextAction.callCustomer';
    }

    return '';
  }

  protected nextActionDate(order: ServiceOrder): string {
    const date =
      order.status === 'scheduled' ? order.scheduledAt : order.nextContactAt || order.scheduledAt;

    return date
      ? this.formatNextActionDate(date)
      : this.transloco.translate('serviceOrders.nextAction.today');
  }

  protected nextActionDotClasses(order: ServiceOrder): string {
    return classNames(
      'mt-1.5 size-2 shrink-0 rounded-full',
      order.status === 'contact_required' && 'bg-warning',
      order.status === 'scheduled' && 'bg-info',
      order.status === 'new' && 'bg-brand',
    );
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
      queryParams: { action: null },
      queryParamsHandling: 'merge',
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

  protected saveNote(value: ServiceOrderNoteFormValue): void {
    this.store.addNote(this.orderId(), value.content, value.photos);
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

  protected createDevice(): void {
    void this.router.navigate(['/devices/new']);
  }

  protected confirmCancellation(): void {
    this.store.cancelOrder(this.orderId());
    this.isCancellationModalOpen.set(false);
  }

  protected backToOrigin(): void {
    const customerId = this.returnCustomerId();

    void this.router.navigate(customerId ? ['/customers', customerId] : ['/service-orders'], {
      replaceUrl: true,
    });
  }
}
