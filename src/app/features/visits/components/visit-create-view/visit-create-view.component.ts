import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import {
  UiBadgeComponent,
  UiButtonComponent,
  UiCardComponent,
  UiEmptyStateComponent,
  UiInputComponent,
  UiSelectComponent,
  UiSelectOption,
} from '../../../../ui';
import { CustomerFormModalComponent } from '../../../customers/components/customer-form-modal.component';
import { DeviceFormModalComponent } from '../../../customers/components/device-form-modal.component';
import { CustomersStore } from '../../../customers/data/customers.store';
import { Customer, CustomerDraft } from '../../../customers/models/customer.model';
import { Device, DeviceDraft } from '../../../customers/models/device.model';
import { InspectionDetails, InspectionsStore } from '../../../inspections/data/inspections.store';
import { VisitsStore } from '../../data/visits.store';
import {
  VISIT_TYPE_OPTIONS,
  VisitType,
  getVisitTypeLabel,
} from '../../models/visit.model';
import { VisitCustomerPickerModalComponent } from '../visit-customer-picker-modal/visit-customer-picker-modal.component';
import { VisitDevicePickerModalComponent } from '../visit-device-picker-modal/visit-device-picker-modal.component';
import { VisitScheduledInspectionPickerModalComponent } from '../visit-scheduled-inspection-picker-modal/visit-scheduled-inspection-picker-modal.component';

interface NewDeviceDraft {
  tempId: string;
  draft: DeviceDraft;
}

interface VisitDeviceEntry {
  key: string;
  label: string;
  description: string;
  existingDeviceId?: string;
  newDevice?: NewDeviceDraft;
}

const TEXTAREA_CLASSES =
  'ui-focus-ring block min-h-28 w-full rounded-[0.95rem] border border-border/90 bg-white px-4 py-3.5 text-[15px]/6 text-text-main shadow-[inset_0_1px_0_rgb(255_255_255/0.82),0_1px_2px_rgb(15_23_42/0.05)] backdrop-blur-xl transition duration-200 placeholder:text-text-muted/78 hover:border-primary/24 hover:bg-white focus:border-primary';

@Component({
  selector: 'app-visit-create-view',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    UiBadgeComponent,
    UiButtonComponent,
    UiCardComponent,
    UiEmptyStateComponent,
    UiInputComponent,
    UiSelectComponent,
    CustomerFormModalComponent,
    DeviceFormModalComponent,
    VisitCustomerPickerModalComponent,
    VisitDevicePickerModalComponent,
    VisitScheduledInspectionPickerModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './visit-create-view.component.html',
})
export class VisitCreateViewComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly customersStore = inject(CustomersStore);
  private readonly inspectionsStore = inject(InspectionsStore);
  private readonly visitsStore = inject(VisitsStore);

  protected readonly textareaClasses = TEXTAREA_CLASSES;
  protected readonly visitTypeOptions: UiSelectOption[] = VISIT_TYPE_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
  }));
  protected readonly nextInspectionPeriodOptions: UiSelectOption[] = [
    { value: '6', label: '6 miesięcy' },
    { value: '12', label: '12 miesięcy' },
  ];

  protected readonly visitType = signal<VisitType | ''>('');
  protected readonly visitDate = signal(this.today());
  protected readonly selectedCustomerId = signal('');
  protected readonly customerCreatedInVisit = signal(false);
  protected readonly selectedExistingDeviceIds = signal<string[]>([]);
  protected readonly newDeviceDrafts = signal<NewDeviceDraft[]>([]);
  protected readonly scheduledInspectionId = signal('');
  protected readonly scheduledInspectionAnswer = signal<'unset' | 'yes' | 'no'>('unset');
  protected readonly commonNoteEnabled = signal(true);
  protected readonly commonNote = signal('');
  protected readonly deviceNotes = signal<Record<string, string>>({});
  protected readonly scheduleNextInspection = signal(false);
  protected readonly nextInspectionPeriod = signal('');
  protected readonly nextInspectionDate = signal('');
  protected readonly submitAttempted = signal(false);

  protected readonly isCustomerPickerOpen = signal(false);
  protected readonly isCustomerFormOpen = signal(false);
  protected readonly isDevicePickerOpen = signal(false);
  protected readonly isDeviceFormOpen = signal(false);
  protected readonly isScheduledInspectionPickerOpen = signal(false);

  protected readonly customers = this.customersStore.customers;
  protected readonly selectedCustomer = computed(() =>
    this.customersStore.getCustomerById(this.selectedCustomerId()),
  );
  protected readonly scheduledInspections = computed(() =>
    this.inspectionsStore.inspectionDetails().filter(
      (details) => details.inspection.status === 'scheduled',
    ),
  );
  protected readonly selectedScheduledInspection = computed(() => {
    const inspectionId = this.scheduledInspectionId();

    return inspectionId ? this.inspectionsStore.getInspectionDetailsById(inspectionId) : undefined;
  });
  protected readonly canShowCustomerStep = computed(() =>
    Boolean(this.visitType()) &&
    (this.visitType() !== 'inspection' || this.scheduledInspectionAnswer() !== 'unset'),
  );
  protected readonly canPickExistingDevices = computed(() => {
    if (!this.selectedCustomer() || this.isVisitFromScheduledInspection()) {
      return false;
    }

    if (this.visitType() === 'installation') {
      return false;
    }

    return !this.customerCreatedInVisit();
  });
  protected readonly canAddNewDevices = computed(() =>
    Boolean(this.selectedCustomer()) && !this.isVisitFromScheduledInspection(),
  );
  protected readonly deviceEntries = computed<VisitDeviceEntry[]>(() => {
    const customer = this.selectedCustomer();
    const existingDevices = customer?.devices ?? [];
    const existingEntries = this.selectedExistingDeviceIds()
      .map((deviceId) => existingDevices.find((device) => device.id === deviceId))
      .filter((device): device is Device => Boolean(device))
      .map((device) => ({
        key: device.id,
        existingDeviceId: device.id,
        label: this.deviceName(device),
        description: this.deviceAddress(customer, device),
      }));
    const draftEntries = this.newDeviceDrafts().map((newDevice) => ({
      key: newDevice.tempId,
      newDevice,
      label: `${newDevice.draft.brand} ${newDevice.draft.model}`.trim() || 'Nowe urządzenie',
      description: newDevice.draft.location || 'Zostanie dodane przy zapisie wizyty',
    }));

    return [...existingEntries, ...draftEntries];
  });
  protected readonly hasValidationErrors = computed(() =>
    this.submitAttempted() &&
    (!this.visitType() ||
      !this.selectedCustomer() ||
      !this.visitDate().trim() ||
      !this.deviceEntries().length ||
      (this.visitType() === 'inspection' && this.scheduledInspectionAnswer() === 'unset') ||
      (this.visitType() === 'inspection' &&
        this.scheduleNextInspection() &&
        !this.nextInspectionDate().trim())),
  );

  protected readonly getVisitTypeLabel = getVisitTypeLabel;

  constructor() {
    const prefilledInspectionId = this.route.snapshot.queryParamMap.get('inspectionId');

    if (prefilledInspectionId) {
      this.prefillFromInspection(prefilledInspectionId);
    }
  }

  protected setVisitType(value: string): void {
    this.visitType.set(value as VisitType | '');
    this.scheduledInspectionId.set('');
    this.scheduledInspectionAnswer.set(value === 'inspection' ? 'unset' : 'no');
    this.selectedExistingDeviceIds.set([]);
    this.newDeviceDrafts.set([]);
    this.deviceNotes.set({});
    this.commonNote.set('');
    this.scheduleNextInspection.set(false);
    this.nextInspectionDate.set('');
  }

  protected selectCustomer(customer: Customer): void {
    this.selectedCustomerId.set(customer.id);
    this.customerCreatedInVisit.set(false);
    this.selectedExistingDeviceIds.set([]);
    this.newDeviceDrafts.set([]);
    this.scheduledInspectionId.set('');
    this.isCustomerPickerOpen.set(false);
  }

  protected handleCreateCustomer(draft: CustomerDraft): void {
    const customer = this.customersStore.addCustomer(draft);

    this.selectedCustomerId.set(customer.id);
    this.customerCreatedInVisit.set(true);
    this.selectedExistingDeviceIds.set([]);
    this.newDeviceDrafts.set([]);
    this.isCustomerFormOpen.set(false);
    this.isCustomerPickerOpen.set(false);
  }

  protected handleDeviceSelection(deviceIds: string[]): void {
    this.selectedExistingDeviceIds.set(deviceIds);
    this.isDevicePickerOpen.set(false);
  }

  protected handleAddDevice(draft: DeviceDraft): void {
    this.newDeviceDrafts.update((drafts) => [
      ...drafts,
      {
        tempId: createTempId(),
        draft,
      },
    ]);
    this.isDeviceFormOpen.set(false);
  }

  protected removeDevice(entry: VisitDeviceEntry): void {
    if (entry.existingDeviceId) {
      this.selectedExistingDeviceIds.update((deviceIds) =>
        deviceIds.filter((deviceId) => deviceId !== entry.existingDeviceId),
      );
    }

    if (entry.newDevice) {
      this.newDeviceDrafts.update((drafts) =>
        drafts.filter((draft) => draft.tempId !== entry.newDevice?.tempId),
      );
    }

    this.deviceNotes.update((notes) => {
      const { [entry.key]: _removed, ...remainingNotes } = notes;

      return remainingNotes;
    });
  }

  protected setScheduledInspectionAnswer(answer: 'yes' | 'no'): void {
    this.scheduledInspectionAnswer.set(answer);
    this.scheduledInspectionId.set('');
    this.selectedCustomerId.set('');
    this.selectedExistingDeviceIds.set([]);
    this.newDeviceDrafts.set([]);
    this.customerCreatedInVisit.set(false);

    if (answer === 'yes') {
      this.isScheduledInspectionPickerOpen.set(true);
    }
  }

  protected selectScheduledInspection(details: InspectionDetails): void {
    this.scheduledInspectionId.set(details.inspection.id);
    this.selectedCustomerId.set(details.customer.id);
    this.selectedExistingDeviceIds.set(details.devices.map((device) => device.id));
    this.newDeviceDrafts.set([]);
    this.customerCreatedInVisit.set(false);
    this.isScheduledInspectionPickerOpen.set(false);
  }

  protected setDeviceNote(key: string, note: string): void {
    this.deviceNotes.update((notes) => ({
      ...notes,
      [key]: note,
    }));
  }

  protected setNextInspectionPeriod(period: string): void {
    this.nextInspectionPeriod.set(period);
    this.nextInspectionDate.set(this.addMonths(this.visitDate() || this.today(), Number(period)));
  }

  protected toggleScheduleNextInspection(value: boolean): void {
    this.scheduleNextInspection.set(value);

    if (value && !this.nextInspectionDate()) {
      this.setNextInspectionPeriod(this.nextInspectionPeriod());
    }
  }

  protected submit(): void {
    this.submitAttempted.set(true);

    const selectedVisitType = this.visitType();
    const customer = this.selectedCustomer();
    const entries = this.deviceEntries();

    if (
      !selectedVisitType ||
      !customer ||
      !this.visitDate().trim() ||
      !entries.length ||
      (this.visitType() === 'inspection' && this.scheduledInspectionAnswer() === 'unset') ||
      (this.visitType() === 'inspection' &&
        this.scheduleNextInspection() &&
        !this.nextInspectionDate().trim())
    ) {
      return;
    }

    const persistedDeviceIds: string[] = [];
    const notesByDeviceId = new Map<string, string>();

    for (const entry of entries) {
      if (entry.existingDeviceId) {
        persistedDeviceIds.push(entry.existingDeviceId);
        notesByDeviceId.set(entry.existingDeviceId, this.noteForEntry(entry));
        continue;
      }

      if (!entry.newDevice) {
        continue;
      }

      const device = this.customersStore.addDevice(customer.id, entry.newDevice.draft);

      if (!device) {
        continue;
      }

      persistedDeviceIds.push(device.id);
      notesByDeviceId.set(device.id, this.noteForEntry(entry));
    }

    const visit = this.visitsStore.createVisit({
      customerId: customer.id,
      devicesList: persistedDeviceIds,
      date: this.visitDate(),
      type: selectedVisitType,
      devicesNotes: persistedDeviceIds.map((deviceId) => ({
        deviceId,
        note: notesByDeviceId.get(deviceId) ?? '',
      })),
    });

    if (!visit) {
      return;
    }

    if (this.scheduledInspectionId()) {
      this.inspectionsStore.markCompleted(this.scheduledInspectionId());
    }

    if (selectedVisitType === 'inspection' && this.scheduleNextInspection()) {
      for (const deviceId of persistedDeviceIds) {
        this.customersStore.updateDeviceInspectionSettings(customer.id, deviceId, {
          hasScheduledInspections: true,
          nextInspectionDate: this.nextInspectionDate(),
        });
      }

      this.inspectionsStore.createInspection({
        customerId: customer.id,
        deviceIds: persistedDeviceIds,
        source: 'manual',
      });
    }

    void this.router.navigate(['/visits']);
  }

  protected navigateToVisits(): void {
    void this.router.navigate(['/visits']);
  }

  protected customerName(customer: Customer | undefined): string {
    return customer ? customer.companyName || customer.fullName || 'Klient' : 'Nie wybrano';
  }

  protected entryNote(entry: VisitDeviceEntry): string {
    return this.deviceNotes()[entry.key] ?? '';
  }

  protected isVisitFromScheduledInspection(): boolean {
    return this.visitType() === 'inspection' && this.scheduledInspectionAnswer() === 'yes';
  }

  protected validationMessage(): string {
    if (!this.hasValidationErrors()) {
      return '';
    }

    if (!this.visitType()) {
      return 'Wybierz typ wizyty.';
    }

    if (this.visitType() === 'inspection' && this.scheduledInspectionAnswer() === 'unset') {
      return 'Wybierz, czy przegląd był zaplanowany.';
    }

    if (!this.selectedCustomer()) {
      return 'Wybierz lub dodaj klienta.';
    }

    if (!this.deviceEntries().length) {
      return 'Dodaj przynajmniej jedno urządzenie.';
    }

    if (this.scheduleNextInspection() && !this.nextInspectionDate().trim()) {
      return 'Podaj datę kolejnego przeglądu.';
    }

    return 'Uzupełnij wymagane dane wizyty.';
  }

  private noteForEntry(entry: VisitDeviceEntry): string {
    if (this.deviceEntries().length > 1 && this.commonNoteEnabled()) {
      return this.commonNote();
    }

    return this.entryNote(entry);
  }

  private prefillFromInspection(inspectionId: string): void {
    const details = this.inspectionsStore.getInspectionDetailsById(inspectionId);

    if (!details) {
      return;
    }

    this.visitType.set('inspection');
    this.scheduledInspectionAnswer.set('yes');
    this.selectScheduledInspection(details);
  }

  private deviceName(device: Device): string {
    return `${device.brand} ${device.model}`.trim() || 'Urządzenie';
  }

  private deviceAddress(customer: Customer | undefined, device: Device): string {
    const street = device.hasCustomInstallationAddress ? device.address : customer?.address;
    const postalCode = device.hasCustomInstallationAddress ? device.postalCode : customer?.postalCode;
    const city = device.hasCustomInstallationAddress ? device.city : customer?.city;

    return [street, `${postalCode ?? ''} ${city ?? ''}`.trim()].filter(Boolean).join(', ') || '--';
  }

  private today(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private addMonths(value: string, months: number): string {
    const [year, month, day] = value.split('-').map(Number);
    const date = year && month && day ? new Date(year, month - 1, day) : new Date();

    date.setMonth(date.getMonth() + months);

    const nextYear = date.getFullYear();
    const nextMonth = `${date.getMonth() + 1}`.padStart(2, '0');
    const nextDay = `${date.getDate()}`.padStart(2, '0');

    return `${nextYear}-${nextMonth}-${nextDay}`;
  }
}

function createTempId(): string {
  return `new-device-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
