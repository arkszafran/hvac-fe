import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';

import {
  UiBadgeComponent,
  UiButtonComponent,
  UiCardComponent,
  UiEmptyStateComponent,
} from '../../ui';
import { InspectionCandidatePickerModalComponent } from '../inspections/components/inspection-candidate-picker-modal.component';
import { InspectionLinkProposalModalComponent } from '../inspections/components/inspection-link-proposal-modal.component';
import {
  DeviceUpdateInspectionPlan,
  InspectionDeviceFlowService,
} from '../inspections/data/inspection-device-flow.service';
import { InspectionsStore } from '../inspections/data/inspections.store';
import {
  getInspectionStatusLabel,
  getInspectionStatusVariant,
} from '../inspections/utils/inspection-ui.util';
import { VisitsStore } from '../visits/data/visits.store';
import { getVisitTypeLabel } from '../visits/models/visit.model';
import { DeviceFormModalComponent } from './components/device-form-modal.component';
import { DeviceNextInspectionModalComponent } from './components/device-next-inspection-modal.component';
import { CustomersStore } from './data/customers.store';
import { Customer } from './models/customer.model';
import { DeviceDraft, getDeviceTypeLabel } from './models/device.model';

interface DeviceDetailItem {
  label: string;
  value: string;
}

@Component({
  selector: 'app-device-detail-view',
  standalone: true,
  imports: [
    RouterLink,
    UiBadgeComponent,
    UiButtonComponent,
    UiCardComponent,
    UiEmptyStateComponent,
    DeviceFormModalComponent,
    DeviceNextInspectionModalComponent,
    InspectionLinkProposalModalComponent,
    InspectionCandidatePickerModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './device-detail-view.component.html',
})
export class DeviceDetailViewComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly customersStore = inject(CustomersStore);
  private readonly inspectionsStore = inject(InspectionsStore);
  private readonly inspectionDeviceFlowService = inject(InspectionDeviceFlowService);
  private readonly visitsStore = inject(VisitsStore);

  protected readonly isEditDeviceModalOpen = signal(false);
  protected readonly isNextInspectionModalOpen = signal(false);
  protected readonly pendingUpdateDraft = signal<DeviceDraft | null>(null);
  protected readonly pendingUpdatePlan = signal<DeviceUpdateInspectionPlan | null>(null);
  protected readonly customerId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('customerId') ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('customerId') ?? '' },
  );
  protected readonly deviceId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('deviceId') ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('deviceId') ?? '' },
  );

  protected readonly customer = computed(() =>
    this.customersStore.getCustomerById(this.customerId()),
  );
  protected readonly device = computed(() =>
    this.customersStore.getDeviceById(this.customerId(), this.deviceId()),
  );
  protected readonly deviceVisits = computed(() => this.visitsStore.getVisitsForDevice(this.deviceId()));
  protected readonly activeInspection = computed(() => {
    const device = this.device();

    return device ? this.inspectionsStore.getActiveInspectionByDeviceId(device.id) : undefined;
  });
  protected readonly requiresInspectionAttention = computed(() => {
    const device = this.device();

    return Boolean(
      device?.hasScheduledInspections && device.nextInspectionDate && !this.activeInspection(),
    );
  });
  protected readonly editableDeviceDraft = computed<DeviceDraft | null>(() => {
    const device = this.device();

    if (!device) {
      return null;
    }

    return {
      type: device.type,
      brand: device.brand,
      model: device.model,
      serialNumber: device.serialNumber,
      installationDate: device.installationDate,
      warrantyMonths: device.warrantyMonths,
      hasScheduledInspections: device.hasScheduledInspections,
      nextInspectionDate: device.nextInspectionDate,
      note: device.note,
      refrigerant: device.refrigerant,
      refrigerantAmount: device.refrigerantAmount,
      location: device.location,
      hasCustomInstallationAddress: device.hasCustomInstallationAddress,
      address: device.address,
      postalCode: device.postalCode,
      city: device.city,
      serviceHistory: [...device.serviceHistory],
    };
  });
  protected readonly deviceOverviewItems = computed<readonly DeviceDetailItem[]>(() => {
    const device = this.device();

    if (!device) {
      return [];
    }

    return [
      {
        label: 'Marka',
        value: this.formatValue(device.brand),
      },
      {
        label: 'Model',
        value: this.formatValue(device.model),
      },
      {
        label: 'Data uruchomienia',
        value: this.formatDate(device.installationDate),
      },
      {
        label: 'Gwarancja do',
        value: this.formatDate(device.warrantyUntil),
      },
      {
        label: 'Numer seryjny',
        value: this.formatValue(device.serialNumber),
      },
      {
        label: 'Czynnik',
        value: this.formatValue(device.refrigerant),
      },
      {
        label: 'Ilość czynnika',
        value: this.formatValue(device.refrigerantAmount),
      },
    ];
  });
  protected readonly nextInspectionDateLabel = computed(() => {
    const device = this.device();

    if (!device?.hasScheduledInspections) {
      return 'Przeglądy wyłączone';
    }

    return device.nextInspectionDate ? this.formatDate(device.nextInspectionDate) : 'Brak terminu';
  });
  protected readonly nextInspectionStatusLabel = computed(() => {
    const device = this.device();

    return device?.hasScheduledInspections
      ? 'Przeglądy są aktywne dla tego urządzenia.'
      : 'Włącz przeglądy, aby ustawić termin kolejnej wizyty.';
  });
  protected readonly installationFacts = computed<readonly DeviceDetailItem[]>(() => {
    const device = this.device();

    if (!device) {
      return [];
    }

    return [
      {
        label: 'Adres instalacji',
        value: this.installationAddress(),
      },
      {
        label: 'Miejsce montażu',
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
    const postalCode = device.hasCustomInstallationAddress ? device.postalCode : customer.postalCode;
    const city = device.hasCustomInstallationAddress ? device.city : customer.city;
    const cityLine = [postalCode, city].filter(Boolean).join(' ').trim();
    const addressLines = [street, cityLine].filter(Boolean);

    return addressLines.length ? addressLines.join('\n') : '--';
  });

  protected readonly getDeviceTypeLabel = getDeviceTypeLabel;
  protected readonly getInspectionStatusLabel = getInspectionStatusLabel;
  protected readonly getInspectionStatusVariant = getInspectionStatusVariant;
  protected readonly getVisitTypeLabel = getVisitTypeLabel;

  protected visitNote(deviceId: string, visitId: string): string {
    const visit = this.deviceVisits().find((details) => details.visit.id === visitId)?.visit;

    return visit?.devicesNotes.find((item) => item.deviceId === deviceId)?.note || '--';
  }

  protected customerTitle(customer: Customer): string {
    return customer.companyName || customer.fullName || 'Klient';
  }

  protected navigateToCustomer(customerId: string): void {
    void this.router.navigate(['/customers', customerId]);
  }

  protected navigateToCustomers(): void {
    void this.router.navigate(['/customers']);
  }

  protected navigateToInspection(inspectionId: string): void {
    void this.router.navigate(['/inspections', inspectionId]);
  }

  protected navigateToInspections(): void {
    void this.router.navigate(['/inspections']);
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

    this.finishUpdateDevice(plan, draft, { kind: 'attach', inspectionId });
  }

  protected formatDate(value: string): string {
    if (!value) {
      return '--';
    }

    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('pl-PL').format(parsedDate);
  }

  private processDeviceUpdate(deviceDraft: DeviceDraft): void {
    const device = this.device();
    const customer = this.customer();

    if (!device || !customer) {
      return;
    }

    const plan = this.inspectionDeviceFlowService.previewUpdateDevice(customer, device, deviceDraft);

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
    plan: DeviceUpdateInspectionPlan,
    deviceDraft: DeviceDraft,
    choice?: { kind: 'create-new' } | { kind: 'attach'; inspectionId: string },
  ): void {
    const device = this.device();
    const customer = this.customer();

    if (!device || !customer) {
      return;
    }

    const result = this.inspectionDeviceFlowService.commitUpdateDevice(
      customer,
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
