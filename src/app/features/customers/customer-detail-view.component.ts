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
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { map } from 'rxjs';

import {
  CustomerDetailsDto,
  CustomerDeviceListItemDto,
  CustomerDto,
  CustomersApi,
  DeviceDto,
  DevicesApi,
  mapApiError,
} from '../../common/api';
import {
  ToastService,
  UiBadgeComponent,
  UiButtonComponent,
  UiEmptyStateComponent,
  UiIconComponent,
} from '../../ui';
import { UiMapPinIconComponent } from '../../ui/map-pin-icon/map-pin-icon.component';
import { ServiceOrderCandidatePickerModalComponent } from '../service-orders/components/service-order-candidate-picker-modal/service-order-candidate-picker-modal.component';
import { ServiceOrderLinkProposalModalComponent } from '../service-orders/components/service-order-link-proposal-modal/service-order-link-proposal-modal.component';
import { CustomerFormModalComponent } from './components/customer-form-modal.component';
import { CustomerServiceOrderListComponent } from './components/customer-service-order-list/customer-service-order-list.component';
import { DeviceFormModalComponent } from './components/device-form-modal.component';
import { DeviceListComponent } from './components/device-list.component';
import {
  toCreateDeviceDto,
  toDeviceDraft,
  toUpdateCustomerDto,
  toUpdateDeviceDto,
} from './data/customer-api.mapper';
import {
  ApiDeviceCreatePlan,
  ApiDeviceUpdatePlan,
  CustomerDeviceFlowService,
  DeviceFlowChoice,
} from './data/customer-device-flow.service';
import { CustomerDraft } from './models/customer.model';
import { DeviceDraft } from './models/device.model';
import {
  customerEmailHref,
  customerMapHref,
  customerPhoneHref,
  formatCustomerAddress,
  formatCustomerName,
} from './utils/customer-ui.util';

@Component({
  selector: 'app-customer-detail-view',
  imports: [
    TranslocoPipe,
    UiBadgeComponent,
    UiButtonComponent,
    UiEmptyStateComponent,
    UiIconComponent,
    UiMapPinIconComponent,
    CustomerFormModalComponent,
    CustomerServiceOrderListComponent,
    DeviceFormModalComponent,
    DeviceListComponent,
    ServiceOrderLinkProposalModalComponent,
    ServiceOrderCandidatePickerModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './customer-detail-view.component.html',
})
export class CustomerDetailViewComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly customersApi = inject(CustomersApi);
  private readonly devicesApi = inject(DevicesApi);
  private readonly deviceFlow = inject(CustomerDeviceFlowService);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);
  private readonly detailsState = signal<CustomerDetailsDto | null>(null);
  private readonly hasLoadedState = signal(false);
  private readonly hasLoadErrorState = signal(false);
  private readonly editingDeviceState = signal<DeviceDto | null>(null);

  protected readonly isEditCustomerModalOpen = signal(false);
  protected readonly isAddDeviceModalOpen = signal(false);
  protected readonly isEditDeviceModalOpen = signal(false);
  protected readonly pendingCreateDraft = signal<DeviceDraft | null>(null);
  protected readonly pendingCreatePlan = signal<ApiDeviceCreatePlan | null>(null);
  protected readonly pendingUpdateDraft = signal<DeviceDraft | null>(null);
  protected readonly pendingUpdatePlan = signal<ApiDeviceUpdatePlan | null>(null);
  protected readonly customerId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('id') ?? '' },
  );
  protected readonly customer = computed(() => this.detailsState()?.customer ?? null);
  protected readonly customerDevices = computed(() => this.detailsState()?.devices ?? []);
  protected readonly customerOrders = computed(() =>
    [...(this.detailsState()?.serviceOrders ?? [])].sort((left, right) =>
      right.orderDate.localeCompare(left.orderDate),
    ),
  );
  protected readonly hasLoaded = this.hasLoadedState.asReadonly();
  protected readonly hasLoadError = this.hasLoadErrorState.asReadonly();
  protected readonly editingDeviceId = computed(() => this.editingDeviceState()?.id ?? null);
  protected readonly editableCustomerDraft = computed<CustomerDraft | null>(() => {
    const customer = this.customer();

    return customer
      ? {
          type: customer.type,
          companyName: customer.companyName,
          fullName: customer.fullName,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
          postalCode: customer.postalCode,
          city: customer.city,
        }
      : null;
  });
  protected readonly editableDeviceDraft = computed<DeviceDraft | null>(() => {
    const device = this.editingDeviceState();

    return device ? toDeviceDraft(device, this.activeInspectionForDevice(device.id)) : null;
  });

  protected readonly customerTitle = formatCustomerName;
  protected readonly formatAddress = formatCustomerAddress;
  protected readonly phoneHref = customerPhoneHref;
  protected readonly emailHref = customerEmailHref;
  protected readonly mapHref = customerMapHref;

  constructor() {
    effect(() => {
      const customerId = this.customerId();

      if (customerId) {
        this.loadCustomerDetails(customerId);
      }
    });
  }

  protected customerTypeLabel(customer: CustomerDto): string {
    return this.transloco.translate(
      customer.type === 'company'
        ? 'customers.types.company.shortLabel'
        : 'customers.types.individual.shortLabel',
    );
  }

  protected handleUpdateCustomer(customerDraft: CustomerDraft): void {
    const customer = this.customer();

    if (!customer) {
      return;
    }

    this.customersApi
      .updateCustomer(customer.id, toUpdateCustomerDto(customerDraft))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ data }) => {
          this.detailsState.update((details) =>
            details ? { ...details, customer: data } : details,
          );
          this.isEditCustomerModalOpen.set(false);
          this.toast.success(this.transloco.translate('customers.toast.updated'));
        },
        error: () => undefined,
      });
  }

  protected navigateToCustomers(): void {
    void this.router.navigate(['/customers']);
  }

  protected retryLoad(): void {
    const customerId = this.customerId();

    if (customerId) {
      this.loadCustomerDetails(customerId);
    }
  }

  protected handleAddDevice(deviceDraft: DeviceDraft): void {
    const customer = this.customer();

    if (!customer) {
      return;
    }

    this.deviceFlow
      .previewCreateDevice(customer, this.customerDevices(), deviceDraft)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (plan) => {
          if (plan.kind === 'single-candidate' || plan.kind === 'candidate-choice') {
            this.pendingCreateDraft.set(deviceDraft);
            this.pendingCreatePlan.set(plan);
            this.isAddDeviceModalOpen.set(false);
            return;
          }

          this.finishCreateDevice(plan, deviceDraft);
        },
        error: () => undefined,
      });
  }

  protected handleEditDevice(device: CustomerDeviceListItemDto): void {
    this.devicesApi
      .getDeviceDetails(device.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ data }) => {
          if (data.device.customerId !== this.customerId()) {
            return;
          }

          this.editingDeviceState.set(data.device);
          this.isEditDeviceModalOpen.set(true);
        },
        error: () => undefined,
      });
  }

  protected handleUpdateDevice(deviceDraft: DeviceDraft): void {
    const customer = this.customer();
    const device = this.editingDeviceState();

    if (!customer || !device) {
      return;
    }

    this.deviceFlow
      .previewUpdateDevice(
        customer,
        this.customerDevices(),
        device,
        this.activeInspectionForDevice(device.id),
        deviceDraft,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (plan) => {
          if (plan.kind === 'single-candidate' || plan.kind === 'candidate-choice') {
            this.pendingUpdateDraft.set(deviceDraft);
            this.pendingUpdatePlan.set(plan);
            this.isEditDeviceModalOpen.set(false);
            return;
          }

          this.finishUpdateDevice(plan, deviceDraft);
        },
        error: () => undefined,
      });
  }

  protected closeEditDeviceModal(): void {
    this.isEditDeviceModalOpen.set(false);
    this.editingDeviceState.set(null);
  }

  protected clearCreatePlan(): void {
    this.pendingCreateDraft.set(null);
    this.pendingCreatePlan.set(null);
  }

  protected clearUpdatePlan(): void {
    this.pendingUpdateDraft.set(null);
    this.pendingUpdatePlan.set(null);
    this.editingDeviceState.set(null);
  }

  protected confirmCreateNewInspection(): void {
    this.resolvePendingCreate({ kind: 'create-new' });
  }

  protected confirmCreateAttach(serviceOrderId: string): void {
    this.resolvePendingCreate({ kind: 'attach', serviceOrderId });
  }

  protected confirmUpdateCreateNewInspection(): void {
    this.resolvePendingUpdate({ kind: 'create-new' });
  }

  protected confirmUpdateAttach(serviceOrderId: string): void {
    this.resolvePendingUpdate({ kind: 'attach', serviceOrderId });
  }

  private loadCustomerDetails(customerId: string): void {
    this.hasLoadedState.set(false);
    this.hasLoadErrorState.set(false);

    this.customersApi
      .getCustomerDetails(customerId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ data }) => {
          if (customerId !== this.customerId()) {
            return;
          }

          this.detailsState.set(data);
          this.hasLoadedState.set(true);
        },
        error: (error: unknown) => {
          if (customerId !== this.customerId()) {
            return;
          }

          this.detailsState.set(null);
          this.hasLoadedState.set(true);
          this.hasLoadErrorState.set(mapApiError(error).status !== 404);
        },
      });
  }

  private activeInspectionForDevice(deviceId: string) {
    return (
      this.customerDevices().find((device) => device.id === deviceId)?.activeInspection ?? null
    );
  }

  private resolvePendingCreate(choice: DeviceFlowChoice): void {
    const plan = this.pendingCreatePlan();
    const draft = this.pendingCreateDraft();

    if (plan && draft) {
      this.finishCreateDevice(plan, draft, choice);
    }
  }

  private resolvePendingUpdate(choice: DeviceFlowChoice): void {
    const plan = this.pendingUpdatePlan();
    const draft = this.pendingUpdateDraft();

    if (plan && draft) {
      this.finishUpdateDevice(plan, draft, choice);
    }
  }

  private finishCreateDevice(
    plan: ApiDeviceCreatePlan,
    deviceDraft: DeviceDraft,
    choice?: DeviceFlowChoice,
  ): void {
    const customer = this.customer();

    if (!customer) {
      return;
    }

    const serviceOrder = this.deviceFlow.resolveCreateCommand(plan, deviceDraft, choice);

    this.devicesApi
      .createDevice(toCreateDeviceDto(customer.id, deviceDraft, serviceOrder))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.clearCreatePlan();
          this.isAddDeviceModalOpen.set(false);
          this.toast.success(this.transloco.translate('devices.toast.created'));
          this.loadCustomerDetails(customer.id);
        },
        error: () => undefined,
      });
  }

  private finishUpdateDevice(
    plan: ApiDeviceUpdatePlan,
    deviceDraft: DeviceDraft,
    choice?: DeviceFlowChoice,
  ): void {
    const customer = this.customer();
    const device = this.editingDeviceState();

    if (!customer || !device) {
      return;
    }

    const serviceOrder = this.deviceFlow.resolveUpdateCommand(plan, deviceDraft, choice);

    this.devicesApi
      .updateDevice(device.id, toUpdateDeviceDto(deviceDraft, serviceOrder))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.clearUpdatePlan();
          this.isEditDeviceModalOpen.set(false);
          this.toast.success(this.transloco.translate('devices.toast.updated'));
          this.loadCustomerDetails(customer.id);
        },
        error: () => undefined,
      });
  }
}
