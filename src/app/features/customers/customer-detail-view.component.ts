import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { map } from 'rxjs';

import { UiButtonComponent, UiCardComponent, UiEmptyStateComponent } from '../../ui';
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

@Component({
  selector: 'app-customer-detail-view',
  standalone: true,
  imports: [
    RouterLink,
    TranslocoPipe,
    UiButtonComponent,
    UiCardComponent,
    UiEmptyStateComponent,
    CustomerFormModalComponent,
    CustomerServiceOrderListComponent,
    DeviceFormModalComponent,
    DeviceListComponent,
    ServiceOrderLinkProposalModalComponent,
    ServiceOrderCandidatePickerModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-8">
      @if (customer(); as customer) {
        <section class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div class="space-y-1">
            <nav
              class="flex flex-wrap items-center gap-2 text-[13px]/5 font-semibold text-text-muted"
            >
              <a
                routerLink="/customers"
                class="text-primary-strong underline decoration-primary/35 underline-offset-4 transition hover:text-primary hover:decoration-primary"
              >
                {{ 'devices.detail.breadcrumbs.customerList' | transloco }}
              </a>
              <span aria-hidden="true">/</span>
              <span class="text-text-main">{{
                'devices.detail.breadcrumbs.customer'
                  | transloco: { customer: customerTitle(customer) }
              }}</span>
            </nav>

            <h1 class="text-display tracking-[-0.04em] text-text-main">
              {{ customerTitle(customer) }}
            </h1>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <ui-button size="sm" (pressed)="isEditCustomerModalOpen.set(true)">
              {{ 'customers.actions.edit' | transloco }}
            </ui-button>
          </div>
        </section>

        <ui-card>
          <div class="space-y-2.5">
            <div class="space-y-1">
              @if (customer.companyName) {
                <p class="text-h3 tracking-[-0.02em] text-text-main">{{ customer.companyName }}</p>
                <p class="text-body text-text-muted">{{ customer.fullName || '--' }}</p>
              } @else {
                <p class="text-h3 tracking-[-0.02em] text-text-main">
                  {{ customer.fullName || '--' }}
                </p>
              }
            </div>

            <div class="space-y-0.5 text-body text-text-main">
              @if (customer.phone) {
                <a
                  class="ui-focus-ring w-fit text-primary-strong underline decoration-primary/35 underline-offset-4 transition hover:text-primary hover:decoration-primary"
                  [href]="phoneHref(customer.phone)"
                >
                  {{ customer.phone }}
                </a>
              } @else {
                <span>--</span>
              }
              <div>
                @if (customer.email) {
                  <a
                    class="ui-focus-ring w-fit text-primary-strong underline decoration-primary/35 underline-offset-4 transition hover:text-primary hover:decoration-primary"
                    [href]="emailHref(customer.email)"
                  >
                    {{ customer.email }}
                  </a>
                } @else {
                  --
                }
              </div>
            </div>

            <div class="space-y-0.5 text-body text-text-main">
              <div>{{ customer.address || '--' }}</div>
              <div>{{ customer.postalCode || '--' }} {{ customer.city || '' }}</div>
            </div>
          </div>
        </ui-card>

        <ui-card padding="sm">
          <div card-header>
            <h2 class="text-h3 tracking-[-0.02em] text-text-main">
              {{ 'serviceOrders.title' | transloco }}
            </h2>
          </div>

          <app-customer-service-order-list [orders]="customerOrders()" />
        </ui-card>

        <ui-card padding="sm">
          <div
            card-header
            class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <h2 class="text-h3 tracking-[-0.02em] text-text-main">
              {{ 'devices.title' | transloco }}
            </h2>

            <ui-button variant="secondary" size="sm" (pressed)="isAddDeviceModalOpen.set(true)">
              {{ 'devices.actions.add' | transloco }}
            </ui-button>
          </div>

          @if (customer.devices.length) {
            <app-device-list
              [devices]="customer.devices"
              (deviceSelected)="handleDeviceSelected(customer.id, $event)"
              (deviceEditRequested)="handleEditDevice($event)"
            />
          } @else {
            <ui-empty-state
              [title]="'devices.table.emptyTitle' | transloco"
              description=""
              [actionLabel]="'devices.actions.add' | transloco"
              (action)="isAddDeviceModalOpen.set(true)"
            />
          }
        </ui-card>

        <app-customer-form-modal
          [open]="isEditCustomerModalOpen()"
          [initialValue]="editableCustomerDraft()"
          [modalTitle]="'customers.actions.edit' | transloco"
          [modalDescription]="'customers.detail.editModalDescription' | transloco"
          [submitLabel]="'common.actions.saveChanges' | transloco"
          (close)="isEditCustomerModalOpen.set(false)"
          (save)="handleUpdateCustomer($event)"
        />

        <app-device-form-modal
          [open]="isAddDeviceModalOpen()"
          (close)="isAddDeviceModalOpen.set(false)"
          (save)="handleAddDevice($event)"
        />

        <app-device-form-modal
          [open]="isEditDeviceModalOpen()"
          [initialValue]="editableDeviceDraft()"
          [modalTitle]="'devices.actions.edit' | transloco"
          [submitLabel]="'common.actions.saveChanges' | transloco"
          (close)="closeEditDeviceModal()"
          (save)="handleUpdateDevice($event)"
        />

        @if (pendingCreatePlan(); as createPlan) {
          @if (createPlan.kind === 'single-candidate') {
            <app-service-order-link-proposal-modal
              [open]="true"
              [title]="createPlan.title"
              [description]="createPlan.description"
              [customerName]="createPlan.customerName"
              [deviceName]="createPlan.deviceName"
              [order]="createPlan.candidate"
              [primaryActionLabel]="createPlan.primaryActionLabel"
              [secondaryActionLabel]="createPlan.createActionLabel"
              [cancelLabel]="createPlan.cancelActionLabel"
              (close)="clearCreatePlan()"
              (confirm)="confirmCreateAttach(createPlan.candidate.id)"
              (createSeparate)="confirmCreateNewInspection()"
            />
          } @else if (createPlan.kind === 'candidate-choice') {
            <app-service-order-candidate-picker-modal
              [open]="true"
              [title]="createPlan.title"
              [description]="createPlan.description"
              [customerName]="createPlan.customerName"
              [deviceName]="createPlan.deviceName"
              [candidates]="createPlan.candidates"
              [createActionLabel]="createPlan.createActionLabel"
              [cancelActionLabel]="createPlan.cancelActionLabel"
              (close)="clearCreatePlan()"
              (serviceOrderSelected)="confirmCreateAttach($event)"
              (createNew)="confirmCreateNewInspection()"
            />
          }
        }

        @if (pendingUpdatePlan(); as updatePlan) {
          @if (updatePlan.kind === 'single-candidate') {
            <app-service-order-link-proposal-modal
              [open]="true"
              [title]="updatePlan.title"
              [description]="updatePlan.description"
              [customerName]="updatePlan.customerName"
              [deviceName]="updatePlan.deviceName"
              [order]="updatePlan.candidate"
              [primaryActionLabel]="updatePlan.primaryActionLabel"
              [secondaryActionLabel]="updatePlan.createActionLabel"
              [cancelLabel]="updatePlan.cancelActionLabel"
              (close)="clearUpdatePlan()"
              (confirm)="confirmUpdateAttach(updatePlan.candidate.id)"
              (createSeparate)="confirmUpdateCreateNewInspection()"
            />
          } @else if (updatePlan.kind === 'candidate-choice') {
            <app-service-order-candidate-picker-modal
              [open]="true"
              [title]="updatePlan.title"
              [description]="updatePlan.description"
              [customerName]="updatePlan.customerName"
              [deviceName]="updatePlan.deviceName"
              [candidates]="updatePlan.candidates"
              [createActionLabel]="updatePlan.createActionLabel"
              [cancelActionLabel]="updatePlan.cancelActionLabel"
              (close)="clearUpdatePlan()"
              (serviceOrderSelected)="confirmUpdateAttach($event)"
              (createNew)="confirmUpdateCreateNewInspection()"
            />
          }
        }
      } @else {
        <ui-empty-state
          [title]="'customers.detail.notFoundTitle' | transloco"
          [description]="'customers.detail.notFoundDescription' | transloco"
          [actionLabel]="'devices.detail.backToCustomers' | transloco"
          (action)="navigateToCustomers()"
        />
      }
    </div>
  `,
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

  protected customerTitle(customer: Customer): string {
    return (
      customer.companyName || customer.fullName || this.transloco.translate('customers.newCustomer')
    );
  }

  protected phoneHref(phone: string): string {
    return `tel:${phone.replace(/[^\d+]/g, '')}`;
  }

  protected emailHref(email: string): string {
    return `mailto:${email.trim()}`;
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

  protected handleDeviceSelected(customerId: string, device: Device): void {
    void this.router.navigate(['/customers', customerId, 'devices', device.id]);
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
