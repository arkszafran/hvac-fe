import { HttpContext } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { map, of, switchMap, tap } from 'rxjs';

import { CustomersApi, DevicesApi, SKIP_ERROR_TOAST } from '../../common/api';
import { ToastService, UiButtonComponent, UiIconComponent } from '../../ui';
import { CustomerFormModalComponent } from '../customers/components/customer-form-modal.component';
import { toCreateCustomerDto, toCreateDeviceDto } from '../customers/data/customer-api.mapper';
import {
  ApiDeviceCreatePlan,
  CustomerDeviceFlowService,
  DeviceFlowChoice,
} from '../customers/data/customer-device-flow.service';
import { Customer, CustomerDraft } from '../customers/models/customer.model';
import { DeviceDraft } from '../customers/models/device.model';
import { ServiceOrderCandidatePickerModalComponent } from '../service-orders/components/service-order-candidate-picker-modal/service-order-candidate-picker-modal.component';
import { ServiceOrderLinkProposalModalComponent } from '../service-orders/components/service-order-link-proposal-modal/service-order-link-proposal-modal.component';
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
  private readonly destroyRef = inject(DestroyRef);
  private readonly customersApi = inject(CustomersApi);
  private readonly devicesApi = inject(DevicesApi);
  private readonly deviceFlow = inject(CustomerDeviceFlowService);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  protected readonly deviceForm = viewChild(DeviceEditorFormComponent);
  protected readonly isCustomerPickerOpen = signal(false);
  protected readonly isCustomerCreateModalOpen = signal(false);
  protected readonly customerSelection = signal<CustomerSelection | null>(null);
  protected readonly isDeviceFormValid = signal(false);
  protected readonly deviceDraft = signal<DeviceDraft | null>(null);
  protected readonly pendingInspectionPlan = signal<ApiDeviceCreatePlan | null>(null);

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

  protected handleSave(): void {
    const selection = this.customerSelection();
    const deviceDraft = this.deviceDraft();

    if (!selection || !deviceDraft) {
      this.deviceForm()?.markAllAsTouched();
      return;
    }

    if (selection.kind === 'new') {
      this.applyCreatePlan(
        hasInspectionIntent(deviceDraft) ? { kind: 'auto-create' } : { kind: 'save-only' },
      );
      return;
    }

    this.customersApi
      .getCustomerDetails(selection.customer.id)
      .pipe(
        switchMap(({ data }) =>
          this.deviceFlow.previewCreateDevice(data.customer, data.devices, deviceDraft),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (plan) => this.applyCreatePlan(plan),
        error: () => undefined,
      });
  }

  protected closeInspectionPlan(): void {
    this.pendingInspectionPlan.set(null);
  }

  protected createSeparateInspection(): void {
    const plan = this.pendingInspectionPlan();

    if (!plan) {
      return;
    }

    this.finishCreateDevice(plan, { kind: 'create-new' });
  }

  protected attachToInspection(inspectionId?: string): void {
    const plan = this.pendingInspectionPlan();

    if (!plan || !inspectionId) {
      return;
    }

    this.finishCreateDevice(plan, { kind: 'attach', serviceOrderId: inspectionId });
  }

  private applyCreatePlan(plan: ApiDeviceCreatePlan): void {
    if (plan.kind === 'single-candidate' || plan.kind === 'candidate-choice') {
      this.pendingInspectionPlan.set(plan);
      return;
    }

    this.finishCreateDevice(plan);
  }

  private finishCreateDevice(plan: ApiDeviceCreatePlan, choice?: DeviceFlowChoice): void {
    const selection = this.customerSelection();
    const deviceDraft = this.deviceDraft();

    if (!selection || !deviceDraft) {
      return;
    }

    const serviceOrder = this.deviceFlow.resolveCreateCommand(plan, deviceDraft, choice);
    const customerId$ =
      selection.kind === 'existing'
        ? of(selection.customer.id)
        : this.customersApi
            .createCustomer(toCreateCustomerDto(selection.draft), {
              context: new HttpContext().set(SKIP_ERROR_TOAST, true),
            })
            .pipe(
              map(({ data }) => data),
              tap((customer) =>
                this.customerSelection.set({
                  kind: 'existing',
                  customer: { ...customer, devices: [] },
                }),
              ),
              map((customer) => customer.id),
            );

    customerId$
      .pipe(
        switchMap((customerId) =>
          this.devicesApi.createDevice(toCreateDeviceDto(customerId, deviceDraft, serviceOrder), {
            context: new HttpContext().set(SKIP_ERROR_TOAST, true),
          }),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ data }) => {
          this.pendingInspectionPlan.set(null);
          this.toast.success(this.transloco.translate('devices.toast.created'));
          void this.router.navigate(['/devices', data.device.id]);
        },
        error: () => {
          this.toast.error(this.transloco.translate('devices.toast.createError'));
        },
      });
  }
}

function hasInspectionIntent(
  draft: Pick<DeviceDraft, 'hasScheduledInspections' | 'nextInspectionDate'>,
): boolean {
  return draft.hasScheduledInspections && Boolean(draft.nextInspectionDate.trim());
}
