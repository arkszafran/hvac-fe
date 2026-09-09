import { HttpContext } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { map } from 'rxjs';

import {
  CustomerSummaryDto,
  DeviceDetailsDto,
  DeviceVisitDto,
  DevicesApi,
  SKIP_ERROR_TOAST,
  mapApiError,
} from '../../common/api';
import {
  ToastService,
  UiBadgeComponent,
  UiButtonComponent,
  UiEmptyStateComponent,
  UiIconComponent,
  UiPhotoGalleryComponent,
} from '../../ui';
import { DeviceFormModalComponent } from '../customers/components/device-form-modal.component';
import { DeviceNextInspectionModalComponent } from '../customers/components/device-next-inspection-modal.component';
import {
  fromApiDeviceType,
  toDeviceDraft,
  toUpdateDeviceDto,
} from '../customers/data/customer-api.mapper';
import {
  ApiDeviceUpdatePlan,
  CustomerDeviceFlowService,
  DeviceFlowChoice,
} from '../customers/data/customer-device-flow.service';
import {
  DeviceDraft,
  formatDevicePowerKw,
  getDeviceTypeLabel as readDeviceTypeLabel,
} from '../customers/models/device.model';
import { toInspectionDateTimeLocalValue } from '../customers/models/device-inspection.model';
import { ServiceOrderCandidatePickerModalComponent } from '../service-orders/components/service-order-candidate-picker-modal/service-order-candidate-picker-modal.component';
import { ServiceOrderLinkProposalModalComponent } from '../service-orders/components/service-order-link-proposal-modal/service-order-link-proposal-modal.component';
import { getVisitTypeLabel } from '../visits/models/visit.model';

interface DeviceDetailItem {
  labelKey: string;
  value: string;
  isTechnical?: boolean;
}

@Component({
  selector: 'app-device-detail-view',
  imports: [
    RouterLink,
    TranslocoPipe,
    UiBadgeComponent,
    UiButtonComponent,
    UiEmptyStateComponent,
    UiIconComponent,
    UiPhotoGalleryComponent,
    DeviceFormModalComponent,
    DeviceNextInspectionModalComponent,
    ServiceOrderLinkProposalModalComponent,
    ServiceOrderCandidatePickerModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './device-detail-view.component.html',
})
export class DeviceDetailViewComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly devicesApi = inject(DevicesApi);
  private readonly deviceFlow = inject(CustomerDeviceFlowService);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);
  private readonly deviceDetailsState = signal<DeviceDetailsDto | null>(null);
  private readonly hasLoadedState = signal(false);
  private readonly hasLoadErrorState = signal(false);
  private readonly activeLanguage = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  protected readonly isEditDeviceModalOpen = signal(false);
  protected readonly isNextInspectionModalOpen = signal(false);
  protected readonly pendingUpdateDraft = signal<DeviceDraft | null>(null);
  protected readonly pendingUpdatePlan = signal<ApiDeviceUpdatePlan | null>(null);
  protected readonly deviceId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('deviceId') ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('deviceId') ?? '' },
  );

  protected readonly customer = computed(() => this.deviceDetailsState()?.customer ?? null);
  protected readonly device = computed(() => this.deviceDetailsState()?.device ?? null);
  protected readonly deviceVisits = computed(() =>
    [...(this.deviceDetailsState()?.visits ?? [])].sort((left, right) =>
      right.date.localeCompare(left.date),
    ),
  );
  protected readonly activeInspection = computed(
    () => this.deviceDetailsState()?.activeInspection ?? null,
  );
  protected readonly hasLoaded = this.hasLoadedState.asReadonly();
  protected readonly hasLoadError = this.hasLoadErrorState.asReadonly();
  protected readonly editableDeviceDraft = computed<DeviceDraft | null>(() => {
    const device = this.device();

    if (!device) {
      return null;
    }

    return toDeviceDraft(device, this.activeInspection());
  });
  protected readonly deviceOverviewItems = computed<readonly DeviceDetailItem[]>(() => {
    this.activeLanguage();
    const device = this.device();

    if (!device) {
      return [];
    }

    return [
      {
        labelKey: 'devices.detail.fields.brand',
        value: this.formatValue(device.brand),
      },
      {
        labelKey: 'devices.detail.fields.model',
        value: this.formatValue(device.model),
      },
      {
        labelKey: 'devices.detail.fields.powerKw',
        value: formatDevicePowerKw(device.powerKw, this.transloco),
        isTechnical: true,
      },
      {
        labelKey: 'devices.detail.fields.installationDate',
        value: this.formatDate(device.installationDate),
        isTechnical: true,
      },
      {
        labelKey: 'devices.detail.fields.warrantyUntil',
        value: this.formatDate(device.warrantyUntil),
        isTechnical: true,
      },
      {
        labelKey: 'devices.detail.fields.serialNumber',
        value: this.formatValue(device.serialNumber),
        isTechnical: true,
      },
      {
        labelKey: 'devices.detail.fields.refrigerant',
        value: this.formatValue(device.refrigerant),
        isTechnical: true,
      },
      {
        labelKey: 'devices.detail.fields.refrigerantAmount',
        value: this.formatValue(device.refrigerantAmount),
        isTechnical: true,
      },
    ];
  });
  protected readonly nextInspectionDateLabel = computed(() => {
    this.activeLanguage();
    const activeInspection = this.activeInspection();

    if (!activeInspection) {
      return this.transloco.translate('devices.detail.nextInspectionDisabled');
    }

    return activeInspection.scheduledAt
      ? this.formatDateTime(activeInspection.scheduledAt)
      : this.transloco.translate('devices.detail.noInspectionDate');
  });
  protected readonly nextInspectionStatusLabel = computed(() => {
    this.activeLanguage();

    return this.activeInspection()
      ? this.transloco.translate('devices.detail.inspectionActive')
      : this.transloco.translate('devices.detail.inspectionSetupPrompt');
  });
  protected readonly installationFacts = computed<readonly DeviceDetailItem[]>(() => {
    this.activeLanguage();
    const device = this.device();

    if (!device) {
      return [];
    }

    return [
      {
        labelKey: 'devices.detail.fields.installationAddress',
        value: this.installationAddress(),
      },
      {
        labelKey: 'devices.detail.fields.installationPlace',
        value: this.formatValue(device.location),
      },
    ];
  });
  protected readonly installationAddress = computed(() => {
    const device = this.device();
    const customer = this.customer();

    if (!device || !customer) {
      return '--';
    }

    const street = device.hasCustomInstallationAddress ? device.address : customer.address;
    const postalCode = device.hasCustomInstallationAddress
      ? device.postalCode
      : customer.postalCode;
    const city = device.hasCustomInstallationAddress ? device.city : customer.city;
    const cityLine = [postalCode, city].filter(Boolean).join(' ').trim();
    const addressLines = [street, cityLine].filter(Boolean);

    return addressLines.length ? addressLines.join('\n') : '--';
  });

  constructor() {
    effect(() => {
      const deviceId = this.deviceId();

      if (deviceId) {
        this.loadDeviceDetails(deviceId);
        return;
      }

      this.deviceDetailsState.set(null);
      this.hasLoadedState.set(true);
      this.hasLoadErrorState.set(false);
    });
  }

  protected getVisitTypeLabel(type: DeviceVisitDto['type']): string {
    return getVisitTypeLabel(type, this.transloco);
  }

  protected visitNote(visit: DeviceVisitDto): string {
    return visit.note || '--';
  }

  protected customerTitle(customer: CustomerSummaryDto): string {
    return (
      customer.companyName ||
      customer.fullName ||
      this.transloco.translate('customers.fallbackName')
    );
  }

  protected getDeviceTypeLabel(type: DeviceDetailsDto['device']['type']): string {
    return readDeviceTypeLabel(fromApiDeviceType(type), this.transloco);
  }

  protected navigateToDevices(): void {
    void this.router.navigate(['/devices']);
  }

  protected retryLoad(): void {
    const deviceId = this.deviceId();

    if (deviceId) {
      this.loadDeviceDetails(deviceId);
    }
  }

  protected handleUpdateDevice(deviceDraft: DeviceDraft): void {
    this.processDeviceUpdate(deviceDraft);
  }

  protected handleUpdateNextInspectionDate(
    inspectionSettings: Pick<DeviceDraft, 'hasScheduledInspections' | 'nextInspectionDate'>,
  ): void {
    const currentDraft = this.editableDeviceDraft();

    if (!currentDraft) {
      return;
    }

    this.processDeviceUpdate({
      ...currentDraft,
      ...inspectionSettings,
    });
  }

  protected clearUpdatePlan(): void {
    this.pendingUpdateDraft.set(null);
    this.pendingUpdatePlan.set(null);
  }

  protected confirmUpdateCreateNewInspection(): void {
    const plan = this.pendingUpdatePlan();
    const draft = this.pendingUpdateDraft();

    if (!plan || !draft) {
      return;
    }

    this.finishUpdateDevice(plan, draft, { kind: 'create-new' });
  }

  protected confirmUpdateAttach(inspectionId: string): void {
    const plan = this.pendingUpdatePlan();
    const draft = this.pendingUpdateDraft();

    if (!plan || !draft) {
      return;
    }

    this.finishUpdateDevice(plan, draft, { kind: 'attach', serviceOrderId: inspectionId });
  }

  protected formatDate(value: string): string {
    if (!value) {
      return '--';
    }

    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat(this.activeLanguage() === 'pl' ? 'pl-PL' : 'en-US').format(
      parsedDate,
    );
  }

  private formatDateTime(value: string): string {
    const normalizedValue = toInspectionDateTimeLocalValue(value);

    if (!normalizedValue) {
      return value || '--';
    }

    return new Intl.DateTimeFormat(this.activeLanguage() === 'pl' ? 'pl-PL' : 'en-US', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(normalizedValue));
  }

  private processDeviceUpdate(deviceDraft: DeviceDraft): void {
    const device = this.device();

    if (!device) {
      return;
    }

    this.deviceFlow
      .previewUpdateDeviceForCustomer(
        device.customerId,
        device,
        this.activeInspection(),
        deviceDraft,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (plan) => {
          if (plan.kind === 'single-candidate' || plan.kind === 'candidate-choice') {
            this.pendingUpdateDraft.set(deviceDraft);
            this.pendingUpdatePlan.set(plan);
            this.isEditDeviceModalOpen.set(false);
            this.isNextInspectionModalOpen.set(false);
            return;
          }

          this.finishUpdateDevice(plan, deviceDraft);
        },
        error: () => undefined,
      });
  }

  private finishUpdateDevice(
    plan: ApiDeviceUpdatePlan,
    deviceDraft: DeviceDraft,
    choice?: DeviceFlowChoice,
  ): void {
    const device = this.device();

    if (!device) {
      return;
    }

    const serviceOrder = this.deviceFlow.resolveUpdateCommand(plan, deviceDraft, choice);

    this.devicesApi
      .updateDevice(device.id, toUpdateDeviceDto(deviceDraft, serviceOrder), {
        context: new HttpContext().set(SKIP_ERROR_TOAST, true),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.clearUpdatePlan();
          this.isEditDeviceModalOpen.set(false);
          this.isNextInspectionModalOpen.set(false);
          this.toast.success(this.transloco.translate('devices.toast.updated'));
          this.loadDeviceDetails(device.id);
        },
        error: () => {
          this.toast.error(this.transloco.translate('devices.toast.updateError'));
        },
      });
  }

  private loadDeviceDetails(deviceId: string): void {
    this.deviceDetailsState.set(null);
    this.hasLoadedState.set(false);
    this.hasLoadErrorState.set(false);

    this.devicesApi
      .getDeviceDetails(deviceId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ data }) => {
          if (deviceId !== this.deviceId()) {
            return;
          }

          this.deviceDetailsState.set(data);
          this.hasLoadedState.set(true);
        },
        error: (error: unknown) => {
          if (deviceId !== this.deviceId()) {
            return;
          }

          this.deviceDetailsState.set(null);
          this.hasLoadedState.set(true);
          this.hasLoadErrorState.set(mapApiError(error).status !== 404);
        },
      });
  }

  private formatValue(value: string): string {
    return value.trim() || '--';
  }
}
