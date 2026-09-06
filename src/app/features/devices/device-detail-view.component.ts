import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { map } from 'rxjs';

import {
  UiBadgeComponent,
  UiButtonComponent,
  UiEmptyStateComponent,
  UiIconComponent,
  UiPhotoGalleryComponent,
} from '../../ui';
import { DeviceFormModalComponent } from '../customers/components/device-form-modal.component';
import { DeviceNextInspectionModalComponent } from '../customers/components/device-next-inspection-modal.component';
import { CustomersStore } from '../customers/data/customers.store';
import { Customer } from '../customers/models/customer.model';
import {
  DeviceDraft,
  formatDevicePowerKw,
  getDeviceTypeLabel as readDeviceTypeLabel,
} from '../customers/models/device.model';
import { toInspectionDateTimeLocalValue } from '../customers/models/device-inspection.model';
import { ServiceOrderCandidatePickerModalComponent } from '../service-orders/components/service-order-candidate-picker-modal/service-order-candidate-picker-modal.component';
import { ServiceOrderLinkProposalModalComponent } from '../service-orders/components/service-order-link-proposal-modal/service-order-link-proposal-modal.component';
import {
  DeviceUpdateServiceOrderPlan,
  ServiceOrderDeviceFlowService,
} from '../service-orders/data/service-order-device-flow.service';
import { ServiceOrdersStore } from '../service-orders/data/service-orders.store';
import { getVisitTypeLabel, Visit, VisitType } from '../visits/models/visit.model';
import { DevicesStore } from './data/devices.store';
import { Device } from './models/device.model';

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
  private readonly customersStore = inject(CustomersStore);
  private readonly devicesStore = inject(DevicesStore);
  private readonly serviceOrdersStore = inject(ServiceOrdersStore);
  private readonly serviceOrderDeviceFlowService = inject(ServiceOrderDeviceFlowService);
  private readonly transloco = inject(TranslocoService);
  private readonly activeLanguage = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  protected readonly isEditDeviceModalOpen = signal(false);
  protected readonly isNextInspectionModalOpen = signal(false);
  protected readonly pendingUpdateDraft = signal<DeviceDraft | null>(null);
  protected readonly pendingUpdatePlan = signal<DeviceUpdateServiceOrderPlan | null>(null);
  protected readonly deviceId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('deviceId') ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('deviceId') ?? '' },
  );

  protected readonly device = computed(() => this.devicesStore.getDeviceById(this.deviceId()));
  protected readonly deviceVisits = computed(() =>
    [...(this.device()?.visits ?? [])].sort((left, right) => right.date.localeCompare(left.date)),
  );
  protected readonly activeInspection = computed(() => {
    const device = this.device();

    return device
      ? this.serviceOrdersStore.getActiveInspectionOrderByDeviceId(device.id)
      : undefined;
  });
  protected readonly editableDeviceDraft = computed<DeviceDraft | null>(() => {
    const device = this.device();

    if (!device) {
      return null;
    }

    const activeInspection = this.activeInspection();

    return {
      type: device.type,
      brand: device.brand,
      model: device.model,
      powerKw: device.powerKw,
      serialNumber: device.serialNumber,
      installationDate: device.installationDate,
      warrantyMonths: device.warrantyMonths,
      hasScheduledInspections: Boolean(activeInspection),
      nextInspectionDate: activeInspection?.scheduledAt ?? '',
      note: device.note,
      refrigerant: device.refrigerant,
      refrigerantAmount: device.refrigerantAmount,
      location: device.location,
      hasCustomInstallationAddress: device.hasCustomInstallationAddress,
      address: device.address,
      postalCode: device.postalCode,
      city: device.city,
    };
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

    if (!device) {
      return '--';
    }

    const street = device.hasCustomInstallationAddress ? device.address : device.customer.address;
    const postalCode = device.hasCustomInstallationAddress
      ? device.postalCode
      : device.customer.postalCode;
    const city = device.hasCustomInstallationAddress ? device.city : device.customer.city;
    const cityLine = [postalCode, city].filter(Boolean).join(' ').trim();
    const addressLines = [street, cityLine].filter(Boolean);

    return addressLines.length ? addressLines.join('\n') : '--';
  });

  protected getVisitTypeLabel(type: VisitType): string {
    return getVisitTypeLabel(type, this.transloco);
  }

  protected visitNote(visit: Visit, deviceId: string): string {
    return visit?.devicesNotes.find((item) => item.deviceId === deviceId)?.note || '--';
  }

  protected customerTitle(customer: Customer): string {
    return (
      customer.companyName ||
      customer.fullName ||
      this.transloco.translate('customers.fallbackName')
    );
  }

  protected getDeviceTypeLabel(type: DeviceDraft['type']): string {
    return readDeviceTypeLabel(type, this.transloco);
  }

  protected navigateToDevices(): void {
    void this.router.navigate(['/devices']);
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

    const plan = this.serviceOrderDeviceFlowService.previewUpdateDevice(
      device.customer,
      device,
      deviceDraft,
    );

    if (plan.kind === 'single-candidate' || plan.kind === 'candidate-choice') {
      this.pendingUpdateDraft.set(deviceDraft);
      this.pendingUpdatePlan.set(plan);
      this.isEditDeviceModalOpen.set(false);
      this.isNextInspectionModalOpen.set(false);
      return;
    }

    this.finishUpdateDevice(plan, deviceDraft);
  }

  private finishUpdateDevice(
    plan: DeviceUpdateServiceOrderPlan,
    deviceDraft: DeviceDraft,
    choice?: { kind: 'create-new' } | { kind: 'attach'; serviceOrderId: string },
  ): void {
    const device = this.device();

    if (!device) {
      return;
    }

    const result = this.serviceOrderDeviceFlowService.commitUpdateDevice(
      device.customer,
      device,
      deviceDraft,
      plan,
      choice,
    );

    if (!result) {
      return;
    }

    this.clearUpdatePlan();
    this.isEditDeviceModalOpen.set(false);
    this.isNextInspectionModalOpen.set(false);
  }

  private formatValue(value: string): string {
    return value.trim() || '--';
  }
}
