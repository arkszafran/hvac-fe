import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { UiButtonComponent, UiCardComponent, UiPageHeaderComponent } from '../../ui';
import { CustomerFormModalComponent } from '../customers/components/customer-form-modal.component';
import { CustomersStore } from '../customers/data/customers.store';
import { Customer, CustomerDraft } from '../customers/models/customer.model';
import { DeviceDraft } from '../customers/models/device.model';
import { DeviceCustomerPickerModalComponent } from './components/device-customer-picker-modal.component';
import { DeviceEditorFormComponent } from './components/device-editor-form.component';

type CustomerSelection =
  | { kind: 'existing'; customer: Customer }
  | { kind: 'new'; draft: CustomerDraft };

@Component({
  selector: 'app-device-create-view',
  standalone: true,
  imports: [
    RouterLink,
    UiButtonComponent,
    UiCardComponent,
    UiPageHeaderComponent,
    CustomerFormModalComponent,
    DeviceCustomerPickerModalComponent,
    DeviceEditorFormComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './device-create-view.component.html',
})
export class DeviceCreateViewComponent {
  private readonly router = inject(Router);
  private readonly customersStore = inject(CustomersStore);

  protected readonly deviceForm = viewChild(DeviceEditorFormComponent);
  protected readonly customers = this.customersStore.customers;
  protected readonly isCustomerPickerOpen = signal(false);
  protected readonly isCustomerCreateModalOpen = signal(false);
  protected readonly customerSelection = signal<CustomerSelection | null>(null);
  protected readonly isDeviceFormValid = signal(false);
  protected readonly deviceDraft = signal<DeviceDraft | null>(null);

  protected readonly canSave = computed(
    () => this.customerSelection() !== null && this.isDeviceFormValid() && this.deviceDraft() !== null,
  );

  protected openCustomerPicker(): void {
    this.isCustomerPickerOpen.set(true);
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
      return 'Nie wybrano klienta';
    }

    return selection.kind === 'existing'
      ? selection.customer.companyName || selection.customer.fullName || 'Klient'
      : selection.draft.companyName || selection.draft.fullName || 'Nowy klient';
  }

  protected selectedCustomerDescription(): string {
    const selection = this.customerSelection();

    if (!selection) {
      return '';
    }

    if (selection.kind === 'existing') {
      return selection.customer.phone || '--';
    }

    return 'Nowy klient zostanie zapisany razem z urządzeniem w jednym żądaniu.';
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

    return selection.kind === 'existing' ? 'Wybrany klient' : 'Nowy klient do zapisania';
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

    const result =
      selection.kind === 'existing'
        ? this.customersStore.saveDeviceWithCustomer({ customerId: selection.customer.id }, deviceDraft)
        : this.customersStore.saveDeviceWithCustomer({ customerDraft: selection.draft }, deviceDraft);

    if (!result) {
      return;
    }

    await this.router.navigate(['/customers', result.customer.id, 'devices', result.device.id]);
  }
}
