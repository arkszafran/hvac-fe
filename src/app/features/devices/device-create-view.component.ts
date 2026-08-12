import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { UiButtonComponent, UiIconComponent } from '../../ui';
import { CustomerFormModalComponent } from '../customers/components/customer-form-modal.component';
import { CustomersStore } from '../customers/data/customers.store';
import { Customer, CustomerDraft } from '../customers/models/customer.model';
import { DeviceDraft } from '../customers/models/device.model';
import { ServiceOrderCandidatePickerModalComponent } from '../service-orders/components/service-order-candidate-picker-modal/service-order-candidate-picker-modal.component';
import { ServiceOrderLinkProposalModalComponent } from '../service-orders/components/service-order-link-proposal-modal/service-order-link-proposal-modal.component';
import {
  DeviceCreateServiceOrderPlan,
  ServiceOrderDeviceFlowService,
} from '../service-orders/data/service-order-device-flow.service';
import { DeviceCustomerPickerModalComponent } from './components/device-customer-picker-modal.component';
import { DeviceEditorFormComponent } from './components/device-editor-form.component';

type CustomerSelection =
  | { kind: 'existing'; customer: Customer }
  | { kind: 'new'; draft: CustomerDraft };

@Component({
  selector: 'app-device-create-view',
  imports: [
    TranslocoPipe,
    UiButtonComponent,
    UiIconComponent,
    CustomerFormModalComponent,
    DeviceCustomerPickerModalComponent,
    DeviceEditorFormComponent,
    ServiceOrderLinkProposalModalComponent,
    ServiceOrderCandidatePickerModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './device-create-view.component.html',
})
export class DeviceCreateViewComponent {
  private readonly router = inject(Router);
  private readonly customersStore = inject(CustomersStore);
  private readonly serviceOrderDeviceFlowService = inject(ServiceOrderDeviceFlowService);
  private readonly transloco = inject(TranslocoService);

  protected readonly deviceForm = viewChild(DeviceEditorFormComponent);
  protected readonly customers = this.customersStore.customers;
  protected readonly isCustomerPickerOpen = signal(false);
  protected readonly isCustomerCreateModalOpen = signal(false);
  protected readonly customerSelection = signal<CustomerSelection | null>(null);
  protected readonly isDeviceFormValid = signal(false);
  protected readonly deviceDraft = signal<DeviceDraft | null>(null);
  protected readonly pendingInspectionPlan = signal<DeviceCreateServiceOrderPlan | null>(null);

  protected readonly canSave = computed(
    () =>
      this.customerSelection() !== null && this.isDeviceFormValid() && this.deviceDraft() !== null,
  );

  protected openCustomerPicker(): void {
    this.isCustomerPickerOpen.set(true);
  }

  protected navigateToDevices(): void {
    void this.router.navigate(['/devices']);
  }

  protected openCustomerCreateModal(): void {
    this.isCustomerCreateModalOpen.set(true);
  }

  protected handleExistingCustomerSelected(customer: Customer): void {
    this.customerSelection.set({ kind: 'existing', customer });
    this.isCustomerPickerOpen.set(false);
  }

  protected handleNewCustomerDraft(customerDraft: CustomerDraft): void {
    this.customerSelection.set({ kind: 'new', draft: customerDraft });
    this.isCustomerCreateModalOpen.set(false);
  }

  protected updateDeviceFormValidity(isValid: boolean): void {
    this.isDeviceFormValid.set(isValid);
  }

  protected updateDeviceDraft(deviceDraft: DeviceDraft | null): void {
    this.deviceDraft.set(deviceDraft);
  }

  protected selectedCustomerTitle(): string {
    const selection = this.customerSelection();

    if (!selection) {
      return this.transloco.translate('devices.create.noCustomerSelected');
    }

    return selection.kind === 'existing'
      ? selection.customer.companyName ||
          selection.customer.fullName ||
          this.transloco.translate('customers.fallbackName')
      : selection.draft.companyName ||
          selection.draft.fullName ||
          this.transloco.translate('customers.newCustomer');
  }

  protected selectedCustomerDescription(): string {
    const selection = this.customerSelection();

    if (!selection) {
      return '';
    }

    if (selection.kind === 'existing') {
      return selection.customer.phone || '--';
    }

    return this.transloco.translate('devices.create.pendingCustomerDescription');
  }

  protected selectedCustomerEmail(): string {
    const selection = this.customerSelection();

    if (!selection || selection.kind !== 'existing') {
      return '';
    }

    return selection.customer.email || '';
  }

  protected selectedCustomerAddress(): string {
    const selection = this.customerSelection();

    if (!selection) {
      return '--';
    }

    const address =
      selection.kind === 'existing'
        ? [
            selection.customer.address,
            `${selection.customer.postalCode} ${selection.customer.city}`.trim(),
          ]
        : [selection.draft.address, `${selection.draft.postalCode} ${selection.draft.city}`.trim()];

    return address.filter(Boolean).join(', ') || '--';
  }

  protected selectionLabel(): string {
    const selection = this.customerSelection();

    if (!selection) {
      return '';
    }

    return this.transloco.translate(
      selection.kind === 'existing'
        ? 'devices.create.selectedCustomer'
        : 'devices.create.newCustomerToSave',
    );
  }

  protected hasCustomerSelection(): boolean {
    return this.customerSelection() !== null;
  }

  protected async handleSave(): Promise<void> {
    const selection = this.customerSelection();
    const deviceDraft = this.deviceDraft();

    if (!selection || !deviceDraft) {
      this.deviceForm()?.markAllAsTouched();
      return;
    }

    const plan = this.serviceOrderDeviceFlowService.previewCreateDevice(selection, deviceDraft);

    if (plan.kind === 'single-candidate' || plan.kind === 'candidate-choice') {
      this.pendingInspectionPlan.set(plan);
      return;
    }

    await this.finishCreateDevice(plan);
  }

  protected closeInspectionPlan(): void {
    this.pendingInspectionPlan.set(null);
  }

  protected async createSeparateInspection(): Promise<void> {
    const plan = this.pendingInspectionPlan();

    if (!plan) {
      return;
    }

    await this.finishCreateDevice(plan, { kind: 'create-new' });
  }

  protected async attachToInspection(inspectionId?: string): Promise<void> {
    const plan = this.pendingInspectionPlan();

    if (!plan || !inspectionId) {
      return;
    }

    await this.finishCreateDevice(plan, { kind: 'attach', serviceOrderId: inspectionId });
  }

  private async finishCreateDevice(
    plan: DeviceCreateServiceOrderPlan,
    choice?: { kind: 'create-new' } | { kind: 'attach'; serviceOrderId: string },
  ): Promise<void> {
    const selection = this.customerSelection();
    const deviceDraft = this.deviceDraft();

    if (!selection || !deviceDraft) {
      return;
    }

    const result = this.serviceOrderDeviceFlowService.commitCreateDevice(
      selection,
      deviceDraft,
      plan,
      choice,
    );

    if (!result) {
      return;
    }

    this.pendingInspectionPlan.set(null);
    await this.router.navigate(['/devices', result.device.id]);
  }
}
