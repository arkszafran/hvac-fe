import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { map } from 'rxjs';

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
import { ServiceOrderRepairDetailsComponent } from '../service-order-repair-details/service-order-repair-details.component';
import { ServiceOrderScheduleModalComponent } from '../service-order-schedule-modal/service-order-schedule-modal.component';

const TEXTAREA_CLASSES =
  'ui-focus-ring block min-h-32 w-full rounded-[0.95rem] border border-border/90 bg-white px-4 py-3.5 text-[15px]/6 text-text-main transition placeholder:text-text-muted/78 hover:border-primary/24 focus:border-primary';

@Component({
  selector: 'app-service-order-detail-view',
  imports: [
    ReactiveFormsModule,
    TranslocoPipe,
    UiBadgeComponent,
    UiButtonComponent,
    UiCardComponent,
    UiEmptyStateComponent,
    UiModalComponent,
    ServiceOrderInspectionDetailsComponent,
    ServiceOrderInstallationDetailsComponent,
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

  protected readonly textareaClasses = TEXTAREA_CLASSES;
  protected readonly isScheduleModalOpen = signal(
    this.route.snapshot.queryParamMap.get('action') === 'schedule',
  );
  protected readonly isNoteModalOpen = signal(false);
  protected readonly noteControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
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
    this.noteControl.reset('');
    this.isNoteModalOpen.set(true);
  }

  protected saveNote(): void {
    if (this.noteControl.invalid) {
      this.noteControl.markAsTouched();
      return;
    }

    this.store.addNote(this.orderId(), this.noteControl.getRawValue());
    this.isNoteModalOpen.set(false);
  }

  protected createVisit(): void {
    void this.router.navigate(['/visits/new'], {
      queryParams: { serviceOrderId: this.orderId() },
    });
  }

  protected cancelOrder(): void {
    this.store.cancelOrder(this.orderId());
  }

  protected backToList(): void {
    this.closeRequested.emit();
  }
}
