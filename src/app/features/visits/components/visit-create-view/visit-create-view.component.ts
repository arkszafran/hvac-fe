import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';

import {
  createPhotoAttachments,
  LocalPhotoAttachment,
  removePhotoAttachment,
  revokePhotoAttachments,
} from '../../../../common/models/photo-attachment.model';
import { AttachmentUploadService } from '../../../../common/attachments';
import {
  AttachmentContentType,
  CreateVisitDto,
  CreateVisitAttachmentDto,
  CustomersApi,
  ServiceOrderDetailsDto,
  ServiceOrderDeviceDto,
  ServiceOrderListItemDto,
  ServiceOrdersApi,
  VisitAttachmentUploadDto,
  VisitDeviceCommandDto,
  VisitsApi,
} from '../../../../common/api';
import {
  UiButtonComponent,
  UiCardComponent,
  UiEmptyStateComponent,
  UiIconComponent,
  UiInputComponent,
  UiPhotoCaptureComponent,
  UiSelectComponent,
  UiSelectOption,
  ToastService,
} from '../../../../ui';
import { CustomerFormModalComponent } from '../../../customers/components/customer-form-modal.component';
import { DeviceFormModalComponent } from '../../../customers/components/device-form-modal.component';
import { Customer, CustomerDraft } from '../../../customers/models/customer.model';
import {
  Device,
  DeviceDraft,
  createEmptyDeviceDraft,
} from '../../../customers/models/device.model';
import {
  toCreateVisitCustomerDto,
  toCreateVisitDeviceDto,
  toServiceOrderCustomerModel,
  toServiceOrderDeviceModel,
  toVisitCustomer,
} from '../../data/visit-api.mapper';
import { VisitType, createVisitTypeOptions, getVisitTypeLabel } from '../../models/visit.model';
import { VisitCustomerPickerModalComponent } from '../visit-customer-picker-modal/visit-customer-picker-modal.component';
import { VisitDevicePickerModalComponent } from '../visit-device-picker-modal/visit-device-picker-modal.component';
import { VisitScheduledInspectionPickerModalComponent } from '../visit-scheduled-inspection-picker-modal/visit-scheduled-inspection-picker-modal.component';

interface NewDeviceDraft {
  tempId: string;
  draft: DeviceDraft;
  source: 'manual' | 'service-order';
}

interface VisitDeviceEntry {
  key: string;
  label: string;
  description: string;
  existingDeviceId?: string;
  newDevice?: NewDeviceDraft;
}

const TEXTAREA_CLASSES =
  'ui-focus-ring block min-h-28 w-full resize-y rounded-field border border-transparent bg-surface-muted px-3.5 py-2.5 text-body text-text-main transition-colors duration-200 placeholder:text-text-muted hover:border-border focus:border-action focus:bg-surface motion-reduce:transition-none';

@Component({
  selector: 'app-visit-create-view',
  imports: [
    FormsModule,
    TranslocoPipe,
    UiButtonComponent,
    UiCardComponent,
    UiEmptyStateComponent,
    UiIconComponent,
    UiInputComponent,
    UiPhotoCaptureComponent,
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
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly customersApi = inject(CustomersApi);
  private readonly serviceOrdersApi = inject(ServiceOrdersApi);
  private readonly visitsApi = inject(VisitsApi);
  private readonly attachmentUpload = inject(AttachmentUploadService);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);
  private readonly activeLanguage = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  protected readonly textareaClasses = TEXTAREA_CLASSES;
  protected readonly visitTypeOptions = computed<UiSelectOption[]>(() => {
    this.activeLanguage();

    return createVisitTypeOptions(this.transloco);
  });
  protected readonly nextInspectionPeriodOptions = computed<UiSelectOption[]>(() => {
    this.activeLanguage();

    return [
      { value: '6', label: this.transloco.translate('devices.inspections.presets.sixMonths') },
      { value: '12', label: this.transloco.translate('devices.inspections.presets.twelveMonths') },
    ];
  });

  protected readonly visitType = signal<VisitType | ''>('');
  protected readonly visitDate = signal(this.today());
  protected readonly sourceServiceOrderId = signal('');
  protected readonly pendingCustomerDraft = signal<CustomerDraft | null>(null);
  protected readonly customerCreatedInVisit = signal(false);
  protected readonly selectedExistingDeviceIds = signal<string[]>([]);
  protected readonly newDeviceDrafts = signal<NewDeviceDraft[]>([]);
  protected readonly scheduledInspectionAnswer = signal<'unset' | 'yes' | 'no'>('unset');
  protected readonly commonNoteEnabled = signal(true);
  protected readonly commonNote = signal('');
  protected readonly deviceNotes = signal<Record<string, string>>({});
  protected readonly visitPhotos = signal<LocalPhotoAttachment[]>([]);
  protected readonly scheduleNextInspection = signal(false);
  protected readonly nextInspectionPeriod = signal('');
  protected readonly nextInspectionDate = signal('');
  protected readonly submitAttempted = signal(false);
  protected readonly isSubmitting = signal(false);

  protected readonly isCustomerPickerOpen = signal(false);
  protected readonly isCustomerFormOpen = signal(false);
  protected readonly customerFormMode = signal<'create' | 'edit'>('create');
  protected readonly isDevicePickerOpen = signal(false);
  protected readonly isDeviceFormOpen = signal(false);
  protected readonly editingDeviceKey = signal('');
  protected readonly isScheduledInspectionPickerOpen = signal(false);
  private readonly selectedCustomerState = signal<Customer | undefined>(undefined);
  private readonly selectedScheduledInspectionState = signal<ServiceOrderListItemDto | undefined>(
    undefined,
  );
  private isVisitSaved = false;
  private idempotencyKey = '';

  protected readonly selectedCustomer = this.selectedCustomerState.asReadonly();
  protected readonly customerFormInitialValue = computed(() => {
    if (this.customerFormMode() !== 'edit') {
      return null;
    }

    return this.pendingCustomerDraft();
  });
  protected readonly selectedScheduledInspection =
    this.selectedScheduledInspectionState.asReadonly();
  protected readonly canShowCustomerStep = computed(
    () =>
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
  protected readonly canAddNewDevices = computed(
    () => Boolean(this.selectedCustomer()) && !this.isVisitFromScheduledInspection(),
  );
  protected readonly deviceEntries = computed<VisitDeviceEntry[]>(() => {
    this.activeLanguage();
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
      label:
        `${newDevice.draft.brand} ${newDevice.draft.model}`.trim() ||
        this.transloco.translate('visits.create.newDevice'),
      description:
        newDevice.draft.location || this.transloco.translate('visits.create.newDeviceDescription'),
    }));

    return [...existingEntries, ...draftEntries];
  });
  protected readonly editingDeviceEntry = computed(() =>
    this.deviceEntries().find((entry) => entry.key === this.editingDeviceKey()),
  );
  protected readonly deviceFormInitialValue = computed(() => {
    const entry = this.editingDeviceEntry();

    if (entry?.newDevice) {
      return entry.newDevice.draft;
    }

    return null;
  });
  protected readonly hasValidationErrors = computed(
    () =>
      this.submitAttempted() &&
      (!this.visitType() ||
        !this.selectedCustomer() ||
        !this.visitDate().trim() ||
        !this.deviceEntries().length ||
        this.newDeviceDrafts().some((device) => !isCompleteDeviceDraft(device.draft)) ||
        (this.visitType() === 'inspection' && this.scheduledInspectionAnswer() === 'unset') ||
        (this.visitType() === 'inspection' &&
          this.scheduleNextInspection() &&
          !this.nextInspectionDate().trim())),
  );

  protected getVisitTypeLabel(type: VisitType): string {
    this.activeLanguage();

    return getVisitTypeLabel(type, this.transloco);
  }

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (!this.isVisitSaved) {
        revokePhotoAttachments(this.visitPhotos());
      }
    });

    const serviceOrderId = this.route.snapshot.queryParamMap.get('serviceOrderId');

    if (serviceOrderId) {
      void this.prefillFromServiceOrder(serviceOrderId);
    }
  }

  protected setVisitType(value: string): void {
    this.visitType.set(value as VisitType | '');
    this.selectedScheduledInspectionState.set(undefined);
    this.scheduledInspectionAnswer.set(value === 'inspection' ? 'unset' : 'no');
    this.selectedExistingDeviceIds.set([]);
    this.newDeviceDrafts.set([]);
    this.deviceNotes.set({});
    this.commonNote.set('');
    this.scheduleNextInspection.set(false);
    this.nextInspectionDate.set('');
  }

  protected selectCustomer(customer: Customer): void {
    this.isCustomerPickerOpen.set(false);

    this.customersApi
      .getCustomerDetails(customer.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.selectedCustomerState.set(toVisitCustomer(response.data));
          this.pendingCustomerDraft.set(null);
          this.customerCreatedInVisit.set(false);
          this.selectedExistingDeviceIds.set([]);
          this.newDeviceDrafts.set([]);
          this.selectedScheduledInspectionState.set(undefined);
        },
        error: () => undefined,
      });
  }

  protected handleCreateCustomer(draft: CustomerDraft): void {
    this.pendingCustomerDraft.set(draft);
    this.selectedCustomerState.set(this.createPendingCustomerPreview(draft));
    this.customerCreatedInVisit.set(true);
    this.selectedExistingDeviceIds.set([]);
    this.newDeviceDrafts.set([]);
    this.isCustomerFormOpen.set(false);
    this.isCustomerPickerOpen.set(false);
  }

  protected openCustomerCreateForm(): void {
    this.customerFormMode.set('create');
    this.isCustomerFormOpen.set(true);
  }

  protected openCustomerEditForm(): void {
    if (!this.pendingCustomerDraft()) {
      return;
    }

    this.customerFormMode.set('edit');
    this.isCustomerFormOpen.set(true);
  }

  protected closeCustomerForm(): void {
    this.isCustomerFormOpen.set(false);
    this.customerFormMode.set('create');
  }

  protected handleCustomerFormSave(draft: CustomerDraft): void {
    if (this.customerFormMode() === 'edit') {
      this.updateSelectedCustomer(draft);
      return;
    }

    this.handleCreateCustomer(draft);
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
        source: 'manual',
      },
    ]);
    this.closeDeviceForm();
  }

  protected openNewDeviceForm(): void {
    this.editingDeviceKey.set('');
    this.isDeviceFormOpen.set(true);
  }

  protected openDeviceEditForm(entry: VisitDeviceEntry): void {
    if (!entry.newDevice) {
      return;
    }

    this.editingDeviceKey.set(entry.key);
    this.isDeviceFormOpen.set(true);
  }

  protected closeDeviceForm(): void {
    this.isDeviceFormOpen.set(false);
    this.editingDeviceKey.set('');
  }

  protected handleDeviceFormSave(draft: DeviceDraft): void {
    const entry = this.editingDeviceEntry();

    if (!entry) {
      this.handleAddDevice(draft);
      return;
    }

    if (entry.newDevice) {
      this.updateNewDeviceDraft(entry.newDevice.tempId, draft);
      this.closeDeviceForm();
      return;
    }

    this.closeDeviceForm();
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
    this.sourceServiceOrderId.set('');
    this.selectedScheduledInspectionState.set(undefined);
    this.selectedCustomerState.set(undefined);
    this.pendingCustomerDraft.set(null);
    this.selectedExistingDeviceIds.set([]);
    this.newDeviceDrafts.set([]);
    this.customerCreatedInVisit.set(false);

    if (answer === 'yes') {
      this.isScheduledInspectionPickerOpen.set(true);
    }
  }

  protected selectScheduledInspection(details: ServiceOrderListItemDto): void {
    const existingDevices = details.devices
      .filter((device) => device.deviceId !== null)
      .map(toServiceOrderDeviceModel);
    const newDeviceDrafts = details.devices
      .filter((device) => device.deviceId === null)
      .map((device) => this.createNewOrderDeviceDraft(device));
    const customerDraft = this.customerDraftFromOrder(details.customer);
    const customer = details.customer.customerId
      ? toServiceOrderCustomerModel(details.customer, existingDevices)
      : this.createPendingCustomerPreview(customerDraft);

    this.sourceServiceOrderId.set(details.order.id);
    this.selectedCustomerState.set(customer);
    this.selectedScheduledInspectionState.set(details);
    this.pendingCustomerDraft.set(details.customer.customerId ? null : customerDraft);
    this.selectedExistingDeviceIds.set(existingDevices.map((device) => device.id));
    this.newDeviceDrafts.set(newDeviceDrafts);
    this.customerCreatedInVisit.set(details.customer.customerId === null);
    this.isScheduledInspectionPickerOpen.set(false);
  }

  protected setDeviceNote(key: string, note: string): void {
    this.deviceNotes.update((notes) => ({
      ...notes,
      [key]: note,
    }));
  }

  protected addVisitPhotos(files: File[]): void {
    const availableSlots = Math.max(0, MAX_VISIT_ATTACHMENTS - this.visitPhotos().length);
    const acceptedFiles = files
      .slice(0, availableSlots)
      .filter((file) => this.isValidVisitAttachment(file));
    const rejectedFiles = [
      ...files.slice(availableSlots),
      ...files.slice(0, availableSlots).filter((file) => !acceptedFiles.includes(file)),
    ];

    for (const file of rejectedFiles) {
      this.showAttachmentUploadError(file.name);
    }

    this.visitPhotos.update((photos) => [
      ...photos,
      ...createPhotoAttachments(acceptedFiles, 'visit-photo'),
    ]);
  }

  protected removeVisitPhoto(photoId: string): void {
    this.visitPhotos.update((photos) => removePhotoAttachment(photos, photoId));
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

  protected async submit(): Promise<void> {
    if (this.isSubmitting()) {
      return;
    }

    this.submitAttempted.set(true);

    const selectedVisitType = this.visitType();
    const customerPreview = this.selectedCustomer();
    const entries = this.deviceEntries();

    if (
      !selectedVisitType ||
      !customerPreview ||
      !this.visitDate().trim() ||
      !entries.length ||
      this.newDeviceDrafts().some((device) => !isCompleteDeviceDraft(device.draft)) ||
      (this.visitType() === 'inspection' && this.scheduledInspectionAnswer() === 'unset') ||
      (this.visitType() === 'inspection' &&
        this.scheduleNextInspection() &&
        !this.nextInspectionDate().trim())
    ) {
      return;
    }

    this.isSubmitting.set(true);
    this.idempotencyKey ||= createIdempotencyKey();

    try {
      const response = await firstValueFrom(
        this.visitsApi.createVisit(
          this.createVisitDto(selectedVisitType, customerPreview, entries),
          this.idempotencyKey,
        ),
      );

      this.isVisitSaved = true;
      await this.uploadVisitAttachments(response.data.attachmentUploads);
      revokePhotoAttachments(this.visitPhotos());
      this.visitPhotos.set([]);
      this.toast.success(this.transloco.translate('visits.create.toast.success'));
      void this.router.navigate(['/visits']);
    } catch {
      // API errors are presented by the global interceptor.
    } finally {
      this.isSubmitting.set(false);
    }
  }

  protected navigateToVisits(): void {
    void this.router.navigate(['/visits']);
  }

  protected customerName(customer: Customer | undefined): string {
    if (!customer) {
      return this.transloco.translate('common.notSelected');
    }

    return (
      customer.companyName ||
      customer.fullName ||
      this.transloco.translate('customers.fallbackName')
    );
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
      return this.transloco.translate('visits.create.validation.visitType');
    }

    if (this.visitType() === 'inspection' && this.scheduledInspectionAnswer() === 'unset') {
      return this.transloco.translate('visits.create.validation.scheduledInspection');
    }

    if (!this.selectedCustomer()) {
      return this.transloco.translate('visits.create.validation.customer');
    }

    if (!this.deviceEntries().length) {
      return this.transloco.translate('visits.create.validation.device');
    }

    if (this.newDeviceDrafts().some((device) => !isCompleteDeviceDraft(device.draft))) {
      return this.transloco.translate('visits.create.validation.deviceData');
    }

    if (this.scheduleNextInspection() && !this.nextInspectionDate().trim()) {
      return this.transloco.translate('visits.create.validation.nextInspectionDate');
    }

    return this.transloco.translate('visits.create.validation.required');
  }

  private noteForEntry(entry: VisitDeviceEntry): string {
    if (this.deviceEntries().length > 1 && this.commonNoteEnabled()) {
      return this.commonNote();
    }

    return this.entryNote(entry);
  }

  private createVisitDto(
    type: VisitType,
    customer: Customer,
    entries: readonly VisitDeviceEntry[],
  ): CreateVisitDto {
    const pendingCustomerDraft = this.pendingCustomerDraft();

    return {
      type,
      performedOn: this.visitDate().trim(),
      serviceOrderId: this.sourceServiceOrderId() || null,
      customer: pendingCustomerDraft
        ? { kind: 'create', customer: toCreateVisitCustomerDto(pendingCustomerDraft) }
        : { kind: 'existing', customerId: customer.id },
      devices: entries.map((entry) => this.createVisitDeviceCommand(entry)),
      nextInspection:
        type === 'inspection' && this.scheduleNextInspection()
          ? { scheduledAt: this.nextInspectionDate().trim() }
          : null,
      attachments: this.visitPhotos().map((photo) => this.createVisitAttachment(photo)),
    };
  }

  private createVisitDeviceCommand(entry: VisitDeviceEntry): VisitDeviceCommandDto {
    const visitNote = this.noteForEntry(entry).trim();

    if (entry.existingDeviceId) {
      return {
        kind: 'existing',
        deviceId: entry.existingDeviceId,
        visitNote,
      };
    }

    if (!entry.newDevice) {
      throw new Error('Visit device entry has no source.');
    }

    return {
      kind: 'create',
      device: toCreateVisitDeviceDto(entry.newDevice.draft),
      visitNote,
    };
  }

  private createVisitAttachment(photo: LocalPhotoAttachment): CreateVisitAttachmentDto {
    return {
      clientFileId: photo.id,
      fileName: photo.file.name,
      contentType: photo.file.type as AttachmentContentType,
      sizeBytes: photo.file.size,
      description: photo.description ?? null,
    };
  }

  private async uploadVisitAttachments(
    uploads: readonly VisitAttachmentUploadDto[],
  ): Promise<void> {
    const uploadsById = new Map(uploads.map((item) => [item.clientFileId, item]));
    const tasks = this.visitPhotos().flatMap((photo) => {
      const item = uploadsById.get(photo.id);

      if (!item) {
        this.showAttachmentUploadError(photo.file.name);
        return [];
      }

      return [{ clientFileId: item.clientFileId, file: photo.file, upload: item.upload }];
    });

    await this.attachmentUpload.uploadFiles(tasks);
  }

  private async prefillFromServiceOrder(serviceOrderId: string): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.serviceOrdersApi
          .getServiceOrderDetails(serviceOrderId, {
            ommitAttachments: true,
          })
          .pipe(takeUntilDestroyed(this.destroyRef)),
      );
      const details = response.data;
      const order = details.order;

      this.sourceServiceOrderId.set(order.id);
      this.visitType.set(order.type);
      this.visitDate.set(order.scheduledAt?.slice(0, 10) || this.today());
      this.scheduledInspectionAnswer.set(order.type === 'inspection' ? 'yes' : 'no');
      this.selectedScheduledInspectionState.set(
        order.type === 'inspection'
          ? {
              order,
              customer: details.customer,
              assignee: details.assignee,
              devices: this.serviceOrderDevices(details),
            }
          : undefined,
      );
      this.commonNote.set('');
      this.scheduleNextInspection.set(false);
      this.nextInspectionDate.set('');

      if (details.customer.customerId) {
        const customerResponse = await firstValueFrom(
          this.customersApi
            .getCustomerDetails(details.customer.customerId)
            .pipe(takeUntilDestroyed(this.destroyRef)),
        );
        this.prefillExistingOrderCustomer(
          toVisitCustomer(customerResponse.data),
          this.serviceOrderDevices(details),
        );
        return;
      }

      this.prefillNewOrderCustomer(details);
    } catch {
      // API errors are presented by the global interceptor.
    }
  }

  private prefillExistingOrderCustomer(
    customer: Customer,
    orderDevices: readonly ServiceOrderDeviceDto[],
  ): void {
    const existingDeviceIds: string[] = [];
    const newDeviceDrafts: NewDeviceDraft[] = [];

    for (const device of orderDevices) {
      const existingDevice = this.findExistingOrderDevice(customer, device);

      if (existingDevice) {
        existingDeviceIds.push(existingDevice.id);
        continue;
      }

      newDeviceDrafts.push(this.createNewOrderDeviceDraft(device));
    }

    this.selectedCustomerState.set(customer);
    this.pendingCustomerDraft.set(null);
    this.customerCreatedInVisit.set(false);
    this.selectedExistingDeviceIds.set(existingDeviceIds);
    this.newDeviceDrafts.set(newDeviceDrafts);
    this.deviceNotes.set({});
  }

  private prefillNewOrderCustomer(details: ServiceOrderDetailsDto): void {
    const orderDevices = this.serviceOrderDevices(details);
    const devices = orderDevices.map((device) => this.createNewOrderDeviceDraft(device));
    const customerDraft = this.customerDraftFromOrder(details.customer);

    this.selectedCustomerState.set(this.createPendingCustomerPreview(customerDraft));
    this.pendingCustomerDraft.set(customerDraft);
    this.customerCreatedInVisit.set(true);
    this.selectedExistingDeviceIds.set([]);
    this.newDeviceDrafts.set(devices);
    this.deviceNotes.set({});
  }

  private updateSelectedCustomer(draft: CustomerDraft): void {
    if (!this.pendingCustomerDraft()) {
      return;
    }

    this.pendingCustomerDraft.set(draft);
    this.selectedCustomerState.set(this.createPendingCustomerPreview(draft));
    this.closeCustomerForm();
  }

  private updateNewDeviceDraft(tempId: string, draft: DeviceDraft): void {
    this.newDeviceDrafts.update((drafts) =>
      drafts.map((newDevice) =>
        newDevice.tempId === tempId
          ? {
              ...newDevice,
              draft,
            }
          : newDevice,
      ),
    );
  }

  private customerDraftFromOrder(customer: ServiceOrderDetailsDto['customer']): CustomerDraft {
    return {
      type: customer.type,
      companyName: customer.companyName,
      fullName: customer.fullName,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      postalCode: customer.postalCode,
      city: customer.city,
    };
  }

  private createPendingCustomerPreview(draft: CustomerDraft): Customer {
    return {
      id: 'pending-request-customer',
      devices: [],
      ...draft,
    };
  }

  private createNewOrderDeviceDraft(device: ServiceOrderDeviceDto): NewDeviceDraft {
    return {
      tempId: `service-order-device-${device.id}`,
      draft: this.deviceDraftFromOrder(device),
      source: 'service-order',
    };
  }

  private deviceDraftFromOrder(device: ServiceOrderDeviceDto): DeviceDraft {
    const draft = createEmptyDeviceDraft();
    const deviceModel = toServiceOrderDeviceModel(device);
    const errorNote = device.displayedError
      ? this.transloco.translate('visits.create.serviceOrderNotes.error', {
          error: device.displayedError,
        })
      : '';

    return {
      ...draft,
      type: deviceModel.type,
      brand: device.brand,
      model: device.model,
      serialNumber: device.serialNumber,
      refrigerant: device.refrigerant,
      refrigerantAmount: device.refrigerantAmount,
      location: device.location,
      hasCustomInstallationAddress: device.hasCustomInstallationAddress,
      address: device.address,
      postalCode: device.postalCode,
      city: device.city,
      note: errorNote,
    };
  }

  private findExistingOrderDevice(
    customer: Customer,
    orderDevice: ServiceOrderDeviceDto,
  ): Device | undefined {
    if (orderDevice.deviceId) {
      const systemDevice = customer.devices.find((device) => device.id === orderDevice.deviceId);

      if (systemDevice) {
        return systemDevice;
      }
    }

    if (!orderDevice.serialNumber.trim()) {
      return undefined;
    }

    return customer.devices.find(
      (device) => device.serialNumber.trim() === orderDevice.serialNumber.trim(),
    );
  }

  private serviceOrderDevices(details: ServiceOrderDetailsDto): ServiceOrderDeviceDto[] {
    return details.serviceData.type === 'installation' ? [] : details.serviceData.devices;
  }

  private isValidVisitAttachment(file: File): boolean {
    return (
      isAttachmentContentType(file.type) &&
      file.size > 0 &&
      file.size <= MAX_VISIT_ATTACHMENT_SIZE_BYTES &&
      file.name.length <= MAX_VISIT_ATTACHMENT_FILE_NAME_LENGTH
    );
  }

  private showAttachmentUploadError(fileName: string): void {
    this.toast.error(this.transloco.translate('attachments.upload.error', { fileName }));
  }

  private deviceName(device: Device): string {
    return (
      `${device.brand} ${device.model}`.trim() || this.transloco.translate('devices.table.device')
    );
  }

  private deviceAddress(customer: Customer | undefined, device: Device): string {
    const street = device.hasCustomInstallationAddress ? device.address : customer?.address;
    const postalCode = device.hasCustomInstallationAddress
      ? device.postalCode
      : customer?.postalCode;
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

function createIdempotencyKey(): string {
  return globalThis.crypto.randomUUID();
}

function isAttachmentContentType(value: string): value is AttachmentContentType {
  return value === 'image/jpeg' || value === 'image/png' || value === 'image/webp';
}

function isCompleteDeviceDraft(draft: DeviceDraft): boolean {
  return Boolean(
    draft.type && draft.brand.trim() && draft.model.trim() && draft.installationDate.trim(),
  );
}

const MAX_VISIT_ATTACHMENTS = 10;
const MAX_VISIT_ATTACHMENT_SIZE_BYTES = 10_485_760;
const MAX_VISIT_ATTACHMENT_FILE_NAME_LENGTH = 255;
