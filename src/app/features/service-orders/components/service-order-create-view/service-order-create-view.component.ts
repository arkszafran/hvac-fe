import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import {
  ToastService,
  UiButtonComponent,
  UiCardComponent,
  UiEmptyStateComponent,
  UiIconComponent,
  UiInputComponent,
  UiSelectComponent,
  UiSelectOption,
} from '../../../../ui';
import { CustomerFormModalComponent } from '../../../customers/components/customer-form-modal.component';
import { DeviceFormModalComponent } from '../../../customers/components/device-form-modal.component';
import { CustomersStore } from '../../../customers/data/customers.store';
import { Customer, CustomerDraft } from '../../../customers/models/customer.model';
import { Device, DeviceDraft } from '../../../customers/models/device.model';
import {
  formatCustomerAddress,
  formatCustomerName,
} from '../../../customers/utils/customer-ui.util';
import { VisitCustomerPickerModalComponent } from '../../../visits/components/visit-customer-picker-modal/visit-customer-picker-modal.component';
import { VisitDevicePickerModalComponent } from '../../../visits/components/visit-device-picker-modal/visit-device-picker-modal.component';
import { ServiceOrdersStore } from '../../data/service-orders.store';
import {
  ServiceOrderAttachment,
  ServiceOrderBuildingType,
  ServiceOrderData,
  ServiceOrderDevice,
  ServiceOrderOutdoorUnitPlace,
  ServiceOrderRoom,
  ServiceOrderType,
} from '../../models/service-order.model';
import { getServiceOrderTypeLabel } from '../../utils/service-order-ui.util';
import { ServiceOrderAttachmentPickerComponent } from '../service-order-attachment-picker/service-order-attachment-picker.component';

type ServiceOrderTypeControlValue = ServiceOrderType | '';

type RoomForm = FormGroup<{
  id: FormControl<string>;
  area: FormControl<string>;
  height: FormControl<string>;
  outdoorUnitPlace: FormControl<ServiceOrderOutdoorUnitPlace | ''>;
  estimatedDistanceToOutdoorUnit: FormControl<string>;
  floor: FormControl<string>;
}>;

interface NewDeviceDraft {
  tempId: string;
  draft: DeviceDraft;
}

interface ServiceOrderDeviceEntry {
  key: string;
  label: string;
  description: string;
  existingDeviceId?: string;
  newDevice?: NewDeviceDraft;
}

interface PersistedDeviceEntry {
  sourceKey: string;
  device: Device;
}

const TEXTAREA_CLASSES =
  'ui-focus-ring block min-h-28 w-full resize-y rounded-field border border-transparent bg-surface-muted px-3.5 py-2.5 text-body text-text-main transition-colors duration-200 placeholder:text-text-muted hover:border-border focus:border-action focus:bg-surface motion-reduce:transition-none';

@Component({
  selector: 'app-service-order-create-view',
  imports: [
    ReactiveFormsModule,
    TranslocoPipe,
    UiButtonComponent,
    UiCardComponent,
    UiEmptyStateComponent,
    UiIconComponent,
    UiInputComponent,
    UiSelectComponent,
    CustomerFormModalComponent,
    DeviceFormModalComponent,
    ServiceOrderAttachmentPickerComponent,
    VisitCustomerPickerModalComponent,
    VisitDevicePickerModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-order-create-view.component.html',
})
export class ServiceOrderCreateViewComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly customersStore = inject(CustomersStore);
  private readonly serviceOrdersStore = inject(ServiceOrdersStore);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);
  private readonly activeLanguage = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  protected readonly textareaClasses = TEXTAREA_CLASSES;
  protected readonly orderForm = this.formBuilder.nonNullable.group({
    type: this.formBuilder.nonNullable.control<ServiceOrderTypeControlValue>(
      '',
      Validators.required,
    ),
    scheduledAt: '',
    note: '',
  });
  protected readonly installationForm = this.formBuilder.nonNullable.group({
    buildingType: this.formBuilder.nonNullable.control<ServiceOrderBuildingType | ''>(
      '',
      Validators.required,
    ),
    rooms: this.formBuilder.array<RoomForm>([this.createRoomForm()]),
  });
  protected readonly rooms = this.installationForm.controls.rooms;

  protected readonly selectedCustomerId = signal('');
  protected readonly isNewCustomer = signal(false);
  protected readonly selectedExistingDeviceIds = signal<string[]>([]);
  protected readonly newDeviceDrafts = signal<NewDeviceDraft[]>([]);
  protected readonly reportedIssues = signal<Record<string, string>>({});
  protected readonly buildingPhotos = signal<ServiceOrderAttachment[]>([]);
  protected readonly roomPhotos = signal<Record<string, ServiceOrderAttachment[]>>({});
  protected readonly devicePhotos = signal<Record<string, ServiceOrderAttachment[]>>({});
  protected readonly submitAttempted = signal(false);

  protected readonly isCustomerPickerOpen = signal(false);
  protected readonly isCustomerFormOpen = signal(false);
  protected readonly customerFormMode = signal<'create' | 'edit'>('create');
  protected readonly isDevicePickerOpen = signal(false);
  protected readonly isDeviceFormOpen = signal(false);
  protected readonly editingDeviceKey = signal('');

  private readonly orderFormStatus = toSignal(this.orderForm.statusChanges, {
    initialValue: this.orderForm.status,
  });
  private readonly installationFormStatus = toSignal(this.installationForm.statusChanges, {
    initialValue: this.installationForm.status,
  });
  protected readonly orderType = toSignal(this.orderForm.controls.type.valueChanges, {
    initialValue: this.orderForm.controls.type.getRawValue(),
  });
  protected readonly customers = this.customersStore.customers;
  protected readonly selectedCustomer = computed(() =>
    this.customersStore.getCustomerById(this.selectedCustomerId()),
  );
  protected readonly customerFormInitialValue = computed(() => {
    if (this.customerFormMode() !== 'edit') {
      return null;
    }

    const customer = this.selectedCustomer();

    return customer ? this.toCustomerDraft(customer) : null;
  });
  protected readonly canPickExistingDevices = computed(
    () =>
      Boolean(this.selectedCustomer()) &&
      !this.isNewCustomer() &&
      Boolean(this.selectedCustomer()?.devices.length),
  );
  protected readonly deviceEntries = computed<ServiceOrderDeviceEntry[]>(() => {
    this.activeLanguage();

    const customer = this.selectedCustomer();
    const existingEntries = this.selectedExistingDeviceIds()
      .map((deviceId) => customer?.devices.find((device) => device.id === deviceId))
      .filter((device): device is Device => Boolean(device))
      .map((device) => ({
        key: device.id,
        existingDeviceId: device.id,
        label: this.deviceName(device),
        description: this.deviceAddress(device),
      }));
    const newEntries = this.newDeviceDrafts().map((newDevice) => ({
      key: newDevice.tempId,
      newDevice,
      label:
        `${newDevice.draft.brand} ${newDevice.draft.model}`.trim() ||
        this.transloco.translate('serviceOrders.create.devices.newDevice'),
      description:
        newDevice.draft.location ||
        this.transloco.translate('serviceOrders.create.devices.newDeviceDescription'),
    }));

    return [...existingEntries, ...newEntries];
  });
  protected readonly editingDeviceEntry = computed(() =>
    this.deviceEntries().find((entry) => entry.key === this.editingDeviceKey()),
  );
  protected readonly deviceFormInitialValue = computed(
    () => this.editingDeviceEntry()?.newDevice?.draft ?? null,
  );
  protected readonly orderTypeOptions = computed(() => {
    this.activeLanguage();

    return (['installation', 'repair', 'inspection'] as const).map((type) => ({
      value: type,
      label: getServiceOrderTypeLabel(type, this.transloco),
    }));
  });
  protected readonly buildingTypeOptions = computed<UiSelectOption[]>(() => {
    this.activeLanguage();

    return [
      {
        value: 'apartment-block',
        label: this.transloco.translate('serviceOrders.buildingTypes.apartmentBlock'),
      },
      {
        value: 'house',
        label: this.transloco.translate('serviceOrders.buildingTypes.house'),
      },
      {
        value: 'office-building',
        label: this.transloco.translate('serviceOrders.buildingTypes.officeBuilding'),
      },
    ];
  });
  protected readonly outdoorUnitPlaceOptions = computed<UiSelectOption[]>(() => {
    this.activeLanguage();

    return [
      {
        value: 'wall',
        label: this.transloco.translate('serviceOrders.outdoorUnitPlaces.wall'),
      },
      {
        value: 'balcony',
        label: this.transloco.translate('serviceOrders.outdoorUnitPlaces.balcony'),
      },
    ];
  });
  protected readonly hasValidationErrors = computed(() => {
    this.orderFormStatus();
    this.installationFormStatus();

    if (!this.submitAttempted()) {
      return false;
    }

    return (
      this.orderForm.invalid ||
      !this.selectedCustomer() ||
      (this.orderType() === 'installation' && this.installationForm.invalid) ||
      ((this.orderType() === 'repair' || this.orderType() === 'inspection') &&
        !this.deviceEntries().length)
    );
  });

  protected readonly formatCustomerName = formatCustomerName;
  protected readonly formatCustomerAddress = formatCustomerAddress;

  protected navigateToOrders(): void {
    void this.router.navigate(['/service-orders']);
  }

  protected selectCustomer(customer: Customer): void {
    this.selectedCustomerId.set(customer.id);
    this.isNewCustomer.set(false);
    this.resetDeviceSelection();
    this.isCustomerPickerOpen.set(false);
  }

  protected openCustomerCreateForm(): void {
    this.customerFormMode.set('create');
    this.isCustomerFormOpen.set(true);
  }

  protected openCustomerEditForm(): void {
    if (!this.selectedCustomer()) {
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
      this.updateCustomer(draft);
      return;
    }

    const customer = this.customersStore.addCustomer(draft);

    this.selectedCustomerId.set(customer.id);
    this.isNewCustomer.set(true);
    this.resetDeviceSelection();
    this.closeCustomerForm();
    this.isCustomerPickerOpen.set(false);
  }

  protected handleDeviceSelection(deviceIds: string[]): void {
    const selectedIds = new Set(deviceIds);
    const removedDeviceIds = this.selectedExistingDeviceIds().filter((id) => !selectedIds.has(id));

    for (const deviceId of removedDeviceIds) {
      this.clearDevicePhotos(deviceId);
    }

    this.selectedExistingDeviceIds.set(deviceIds);
    this.reportedIssues.update((issues) =>
      Object.fromEntries(
        Object.entries(issues).filter(
          ([key]) =>
            selectedIds.has(key) || this.newDeviceDrafts().some((item) => item.tempId === key),
        ),
      ),
    );
    this.isDevicePickerOpen.set(false);
  }

  protected openNewDeviceForm(): void {
    this.editingDeviceKey.set('');
    this.isDeviceFormOpen.set(true);
  }

  protected openDeviceEditForm(entry: ServiceOrderDeviceEntry): void {
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
    const editingEntry = this.editingDeviceEntry();

    if (editingEntry?.newDevice) {
      this.newDeviceDrafts.update((drafts) =>
        drafts.map((item) => (item.tempId === editingEntry.key ? { ...item, draft } : item)),
      );
    } else {
      this.newDeviceDrafts.update((drafts) => [
        ...drafts,
        { tempId: createTempId('new-device'), draft },
      ]);
    }

    this.closeDeviceForm();
  }

  protected removeDevice(entry: ServiceOrderDeviceEntry): void {
    if (entry.existingDeviceId) {
      this.selectedExistingDeviceIds.update((ids) =>
        ids.filter((id) => id !== entry.existingDeviceId),
      );
    }

    if (entry.newDevice) {
      this.newDeviceDrafts.update((drafts) =>
        drafts.filter((draft) => draft.tempId !== entry.newDevice?.tempId),
      );
    }

    this.reportedIssues.update((issues) => {
      const { [entry.key]: _removed, ...remainingIssues } = issues;

      return remainingIssues;
    });
    this.clearDevicePhotos(entry.key);
  }

  protected setReportedIssue(key: string, issue: string): void {
    this.reportedIssues.update((issues) => ({ ...issues, [key]: issue }));
  }

  protected addBuildingPhotos(files: File[]): void {
    this.buildingPhotos.update((photos) => [...photos, ...createAttachments(files)]);
  }

  protected removeBuildingPhoto(photoId: string): void {
    this.buildingPhotos.update((photos) => removeAttachment(photos, photoId));
  }

  protected addRoomPhotos(roomId: string, files: File[]): void {
    const attachments = createAttachments(files);

    this.roomPhotos.update((photos) => ({
      ...photos,
      [roomId]: [...(photos[roomId] ?? []), ...attachments],
    }));
  }

  protected removeRoomPhoto(roomId: string, photoId: string): void {
    this.roomPhotos.update((photos) => ({
      ...photos,
      [roomId]: removeAttachment(photos[roomId] ?? [], photoId),
    }));
  }

  protected addDevicePhotos(deviceKey: string, files: File[]): void {
    const attachments = createAttachments(files);

    this.devicePhotos.update((photos) => ({
      ...photos,
      [deviceKey]: [...(photos[deviceKey] ?? []), ...attachments],
    }));
  }

  protected removeDevicePhoto(deviceKey: string, photoId: string): void {
    this.devicePhotos.update((photos) => ({
      ...photos,
      [deviceKey]: removeAttachment(photos[deviceKey] ?? [], photoId),
    }));
  }

  protected roomId(room: RoomForm): string {
    return room.controls.id.getRawValue();
  }

  protected photosForRoom(room: RoomForm): ServiceOrderAttachment[] {
    return this.roomPhotos()[this.roomId(room)] ?? [];
  }

  protected photosForDevice(deviceKey: string): ServiceOrderAttachment[] {
    return this.devicePhotos()[deviceKey] ?? [];
  }

  protected addRoom(): void {
    this.rooms.push(this.createRoomForm());
  }

  protected removeRoom(index: number): void {
    if (this.rooms.length <= 1) {
      return;
    }

    const roomId = this.roomId(this.rooms.at(index));

    this.clearRoomPhotos(roomId);
    this.rooms.removeAt(index);
  }

  protected fieldError(control: FormControl<string>): string {
    if (!control.invalid || (!this.submitAttempted() && !control.touched)) {
      return '';
    }

    return this.transloco.translate(
      control.hasError('required')
        ? 'serviceOrders.create.validation.requiredField'
        : 'serviceOrders.create.validation.nonNegativeNumber',
    );
  }

  protected submit(): void {
    this.submitAttempted.set(true);
    this.orderForm.markAllAsTouched();
    this.installationForm.markAllAsTouched();

    const customer = this.selectedCustomer();
    const type = this.orderType();
    const deviceEntries = this.deviceEntries();

    if (!customer || !type || !this.isTypeFormValid(type, deviceEntries)) {
      return;
    }

    const serviceData = this.createServiceData(type, customer, deviceEntries);

    if (!serviceData) {
      this.toast.error(this.transloco.translate('serviceOrders.create.toast.error'));
      return;
    }

    const order = this.serviceOrdersStore.createOrder({
      customerId: customer.id,
      serviceData,
      scheduledAt: this.orderForm.controls.scheduledAt.getRawValue(),
    });

    if (!order) {
      this.toast.error(this.transloco.translate('serviceOrders.create.toast.error'));
      return;
    }

    const note = this.orderForm.controls.note.getRawValue().trim();

    if (note) {
      this.serviceOrdersStore.addNote(order.id, note);
    }

    this.toast.success(this.transloco.translate('serviceOrders.create.toast.success'));
    void this.router.navigate(['/service-orders', order.id]);
  }

  private createRoomForm(): RoomForm {
    return this.formBuilder.nonNullable.group({
      id: createTempId('order-room'),
      area: ['', [Validators.required, Validators.min(0.1)]],
      height: ['', [Validators.required, Validators.min(0.1)]],
      outdoorUnitPlace: this.formBuilder.nonNullable.control<ServiceOrderOutdoorUnitPlace | ''>(
        '',
        Validators.required,
      ),
      estimatedDistanceToOutdoorUnit: ['', Validators.min(0)],
      floor: ['', Validators.required],
    });
  }

  private isTypeFormValid(
    type: ServiceOrderType,
    deviceEntries: ServiceOrderDeviceEntry[],
  ): boolean {
    if (this.orderForm.invalid) {
      return false;
    }

    return type === 'installation' ? this.installationForm.valid : deviceEntries.length > 0;
  }

  private createServiceData(
    type: ServiceOrderType,
    customer: Customer,
    deviceEntries: ServiceOrderDeviceEntry[],
  ): ServiceOrderData | null {
    if (type === 'installation') {
      return {
        type,
        buildingType:
          this.installationForm.controls.buildingType.getRawValue() as ServiceOrderBuildingType,
        rooms: this.rooms.controls.map((room) => this.toServiceOrderRoom(room)),
        photos: this.buildingPhotos(),
      };
    }

    const persistedDevices = this.persistDevices(customer, deviceEntries);

    if (persistedDevices.length !== deviceEntries.length) {
      return null;
    }

    if (type === 'repair') {
      return {
        type,
        devices: persistedDevices.map((entry) => this.toServiceOrderDevice(entry)),
      };
    }

    return {
      type,
      deviceIds: persistedDevices.map((entry) => entry.device.id),
      devices: [],
      customerConfirmationStatus: 'pending',
    };
  }

  private persistDevices(
    customer: Customer,
    entries: ServiceOrderDeviceEntry[],
  ): PersistedDeviceEntry[] {
    return entries
      .map((entry): PersistedDeviceEntry | null => {
        const existingDevice = entry.existingDeviceId
          ? customer.devices.find((device) => device.id === entry.existingDeviceId)
          : undefined;
        const device =
          existingDevice ??
          (entry.newDevice
            ? this.customersStore.addDevice(customer.id, entry.newDevice.draft)
            : undefined);

        return device ? { sourceKey: entry.key, device } : null;
      })
      .filter((entry): entry is PersistedDeviceEntry => Boolean(entry));
  }

  private toServiceOrderRoom(room: RoomForm): ServiceOrderRoom {
    const value = room.getRawValue();

    return {
      id: value.id,
      area: Number(value.area),
      height: Number(value.height),
      outdoorUnitPlace: value.outdoorUnitPlace as ServiceOrderOutdoorUnitPlace,
      estimatedDistanceToOutdoorUnit: Number(value.estimatedDistanceToOutdoorUnit),
      floor: Number(value.floor),
      photos: this.roomPhotos()[value.id] ?? [],
    };
  }

  private toServiceOrderDevice(entry: PersistedDeviceEntry): ServiceOrderDevice {
    const device = entry.device;

    return {
      id: device.id,
      systemDeviceId: device.id,
      type: device.type,
      brand: device.brand,
      model: device.model,
      serialNumber: device.serialNumber,
      refrigerant: device.refrigerant,
      refrigerantAmount: device.refrigerantAmount,
      displayedError: this.reportedIssues()[entry.sourceKey]?.trim() || undefined,
      nameplatePhotos: this.devicePhotos()[entry.sourceKey] ?? [],
    };
  }

  private updateCustomer(draft: CustomerDraft): void {
    const customerId = this.selectedCustomerId();

    if (!customerId) {
      return;
    }

    this.customersStore.updateCustomer(customerId, draft);
    this.closeCustomerForm();
  }

  private resetDeviceSelection(): void {
    for (const photos of Object.values(this.devicePhotos())) {
      revokeAttachments(photos);
    }

    this.selectedExistingDeviceIds.set([]);
    this.newDeviceDrafts.set([]);
    this.reportedIssues.set({});
    this.devicePhotos.set({});
  }

  private clearRoomPhotos(roomId: string): void {
    const photosToRemove = this.roomPhotos()[roomId] ?? [];

    revokeAttachments(photosToRemove);
    this.roomPhotos.update((photos) => {
      const { [roomId]: _removed, ...remainingPhotos } = photos;

      return remainingPhotos;
    });
  }

  private clearDevicePhotos(deviceKey: string): void {
    const photosToRemove = this.devicePhotos()[deviceKey] ?? [];

    revokeAttachments(photosToRemove);
    this.devicePhotos.update((photos) => {
      const { [deviceKey]: _removed, ...remainingPhotos } = photos;

      return remainingPhotos;
    });
  }

  private toCustomerDraft(customer: Customer): CustomerDraft {
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

  private deviceName(device: Device): string {
    return (
      `${device.brand} ${device.model}`.trim() || this.transloco.translate('devices.table.device')
    );
  }

  private deviceAddress(device: Device): string {
    const customer = this.selectedCustomer();
    const address = device.hasCustomInstallationAddress ? device.address : customer?.address;
    const postalCode = device.hasCustomInstallationAddress
      ? device.postalCode
      : customer?.postalCode;
    const city = device.hasCustomInstallationAddress ? device.city : customer?.city;

    return [address, `${postalCode ?? ''} ${city ?? ''}`.trim()].filter(Boolean).join(', ') || '--';
  }
}

function createTempId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createAttachments(files: File[]): ServiceOrderAttachment[] {
  return files
    .filter((file) => file.type.startsWith('image/'))
    .map((file) => ({
      id: createTempId('order-photo'),
      fileName: file.name,
      url: URL.createObjectURL(file),
    }));
}

function removeAttachment(
  attachments: ServiceOrderAttachment[],
  attachmentId: string,
): ServiceOrderAttachment[] {
  const attachment = attachments.find((item) => item.id === attachmentId);

  if (attachment) {
    URL.revokeObjectURL(attachment.url);
  }

  return attachments.filter((item) => item.id !== attachmentId);
}

function revokeAttachments(attachments: ServiceOrderAttachment[]): void {
  for (const attachment of attachments) {
    URL.revokeObjectURL(attachment.url);
  }
}
