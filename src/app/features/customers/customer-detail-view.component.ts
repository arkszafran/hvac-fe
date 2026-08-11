import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { map } from 'rxjs';

import {
  UiBadgeComponent,
  UiButtonComponent,
  UiEmptyStateComponent,
  UiIconComponent,
} from '../../ui';
import { UiMapPinIconComponent } from '../../ui/map-pin-icon/map-pin-icon.component';
import { ServiceOrderCandidatePickerModalComponent } from '../service-orders/components/service-order-candidate-picker-modal/service-order-candidate-picker-modal.component';
import { ServiceOrderLinkProposalModalComponent } from '../service-orders/components/service-order-link-proposal-modal/service-order-link-proposal-modal.component';
import {
  DeviceCreateServiceOrderPlan,
  DeviceUpdateServiceOrderPlan,
  ServiceOrderDeviceFlowService,
} from '../service-orders/data/service-order-device-flow.service';
import { ServiceOrdersStore } from '../service-orders/data/service-orders.store';
import { CustomerFormModalComponent } from './components/customer-form-modal.component';
import { CustomerServiceOrderListComponent } from './components/customer-service-order-list/customer-service-order-list.component';
import { DeviceFormModalComponent } from './components/device-form-modal.component';
import { DeviceListComponent } from './components/device-list.component';
import { CustomersStore } from './data/customers.store';
import { Customer, CustomerDraft } from './models/customer.model';
import { Device, DeviceDraft } from './models/device.model';
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
  private readonly customersStore = inject(CustomersStore);
  private readonly serviceOrdersStore = inject(ServiceOrdersStore);
  private readonly serviceOrderDeviceFlowService = inject(ServiceOrderDeviceFlowService);
  private readonly transloco = inject(TranslocoService);

  protected readonly isEditCustomerModalOpen = signal(false);
  protected readonly isAddDeviceModalOpen = signal(false);
  protected readonly isEditDeviceModalOpen = signal(false);
  protected readonly editingDeviceId = signal<string | null>(null);
  protected readonly pendingCreateDraft = signal<DeviceDraft | null>(null);
  protected readonly pendingCreatePlan = signal<DeviceCreateServiceOrderPlan | null>(null);
  protected readonly pendingUpdateDraft = signal<DeviceDraft | null>(null);
  protected readonly pendingUpdatePlan = signal<DeviceUpdateServiceOrderPlan | null>(null);
  protected readonly customerId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
    {
      initialValue: this.route.snapshot.paramMap.get('id') ?? '',
    },
  );

  protected readonly customer = computed(() =>
    this.customersStore.getCustomerById(this.customerId()),
  );
  protected readonly customerOrders = computed(() =>
    this.serviceOrdersStore
      .orders()
      .filter((order) => order.customerId === this.customerId())
      .sort((left, right) => right.orderDate.localeCompare(left.orderDate)),
  );
  protected readonly editableCustomerDraft = computed<CustomerDraft | null>(() => {
    const customer = this.customer();

    if (!customer) {
      return null;
    }

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
  });
  protected readonly editableDeviceDraft = computed<DeviceDraft | null>(() => {
    const customer = this.customer();
    const editingDeviceId = this.editingDeviceId();

    if (!customer || !editingDeviceId) {
      return null;
    }

    const device = customer.devices.find((item) => item.id === editingDeviceId);

    if (!device) {
      return null;
    }

    const activeInspection = this.serviceOrdersStore.getActiveInspectionOrderByDeviceId(device.id);

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

  protected readonly customerTitle = formatCustomerName;
  protected readonly formatAddress = formatCustomerAddress;
  protected readonly phoneHref = customerPhoneHref;
  protected readonly emailHref = customerEmailHref;
  protected readonly mapHref = customerMapHref;

  protected customerTypeLabel(customer: Customer): string {
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

    this.customersStore.updateCustomer(customer.id, customerDraft);
    this.isEditCustomerModalOpen.set(false);
  }

  protected navigateToCustomers(): void {
    void this.router.navigate(['/customers']);
  }

  protected handleAddDevice(deviceDraft: DeviceDraft): void {
    const customer = this.customer();

    if (!customer) {
      return;
    }

    const plan = this.serviceOrderDeviceFlowService.previewCreateDevice(
      { kind: 'existing', customer },
      deviceDraft,
    );

    if (plan.kind === 'single-candidate' || plan.kind === 'candidate-choice') {
      this.pendingCreateDraft.set(deviceDraft);
      this.pendingCreatePlan.set(plan);
      this.isAddDeviceModalOpen.set(false);
      return;
    }

    this.finishCreateDevice(plan, deviceDraft);
  }

  protected handleEditDevice(device: Device): void {
    this.editingDeviceId.set(device.id);
    this.isEditDeviceModalOpen.set(true);
  }

  protected handleUpdateDevice(deviceDraft: DeviceDraft): void {
    const customer = this.customer();
    const device = this.editingDevice();

    if (!customer || !device) {
      return;
    }

    const plan = this.serviceOrderDeviceFlowService.previewUpdateDevice(
      customer,
      device,
      deviceDraft,
    );

    if (plan.kind === 'single-candidate' || plan.kind === 'candidate-choice') {
      this.pendingUpdateDraft.set(deviceDraft);
      this.pendingUpdatePlan.set(plan);
      this.isEditDeviceModalOpen.set(false);
      return;
    }

    this.finishUpdateDevice(plan, deviceDraft);
  }

  protected closeEditDeviceModal(): void {
    this.isEditDeviceModalOpen.set(false);
    this.editingDeviceId.set(null);
  }

  protected clearCreatePlan(): void {
    this.pendingCreateDraft.set(null);
    this.pendingCreatePlan.set(null);
  }

  protected clearUpdatePlan(): void {
    this.pendingUpdateDraft.set(null);
    this.pendingUpdatePlan.set(null);
    this.editingDeviceId.set(null);
  }

  protected confirmCreateNewInspection(): void {
    const plan = this.pendingCreatePlan();
    const draft = this.pendingCreateDraft();

    if (!plan || !draft) {
      return;
    }

    this.finishCreateDevice(plan, draft, { kind: 'create-new' });
  }

  protected confirmCreateAttach(inspectionId: string): void {
    const plan = this.pendingCreatePlan();
    const draft = this.pendingCreateDraft();

    if (!plan || !draft) {
      return;
    }

    this.finishCreateDevice(plan, draft, { kind: 'attach', serviceOrderId: inspectionId });
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

  private editingDevice(): Device | undefined {
    const customer = this.customer();
    const editingDeviceId = this.editingDeviceId();

    return customer?.devices.find((item) => item.id === editingDeviceId);
  }

  private finishCreateDevice(
    plan: DeviceCreateServiceOrderPlan,
    deviceDraft: DeviceDraft,
    choice?: { kind: 'create-new' } | { kind: 'attach'; serviceOrderId: string },
  ): void {
    const customer = this.customer();

    if (!customer) {
      return;
    }

    const result = this.serviceOrderDeviceFlowService.commitCreateDevice(
      { kind: 'existing', customer },
      deviceDraft,
      plan,
      choice,
    );

    if (!result) {
      return;
    }

    this.clearCreatePlan();
    this.isAddDeviceModalOpen.set(false);
  }

  private finishUpdateDevice(
    plan: DeviceUpdateServiceOrderPlan,
    deviceDraft: DeviceDraft,
    choice?: { kind: 'create-new' } | { kind: 'attach'; serviceOrderId: string },
  ): void {
    const customer = this.customer();
    const device = this.editingDevice();

    if (!customer || !device) {
      return;
    }

    const result = this.serviceOrderDeviceFlowService.commitUpdateDevice(
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
    this.closeEditDeviceModal();
  }
}
