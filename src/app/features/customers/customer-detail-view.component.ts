import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';

import { UiButtonComponent, UiCardComponent, UiEmptyStateComponent } from '../../ui';
import { CustomerFormModalComponent } from './components/customer-form-modal.component';
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
    UiButtonComponent,
    UiCardComponent,
    UiEmptyStateComponent,
    CustomerFormModalComponent,
    DeviceFormModalComponent,
    DeviceListComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8">
      @if (customer(); as customer) {
        <section class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div class="space-y-1">
            <nav class="flex flex-wrap items-center gap-2 text-[13px]/5 font-semibold text-text-muted">
              <a
                routerLink="/customers"
                class="text-primary-strong underline decoration-primary/35 underline-offset-4 transition hover:text-primary hover:decoration-primary"
              >
                Lista klientów
              </a>
              <span aria-hidden="true">/</span>
              <span class="text-text-main">Klient: {{ customerTitle(customer) }}</span>
            </nav>

            <h1 class="text-display tracking-[-0.04em] text-text-main">
              {{ customerTitle(customer) }}
            </h1>
            <p class="text-body text-text-muted">{{ customerSubtitle(customer) }}</p>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <ui-button size="sm" (pressed)="isEditCustomerModalOpen.set(true)">
              Edytuj klienta
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
                <p class="text-h3 tracking-[-0.02em] text-text-main">{{ customer.fullName || '--' }}</p>
              }
            </div>

            <div class="space-y-0.5 text-body text-text-main">
              <span>{{ customer.phone || '--' }}</span>
              <div>{{ customer.email || '--' }}</div>
            </div>

            <div class="space-y-0.5 text-body text-text-main">
              <div>{{ customer.address || '--' }}</div>
              <div>{{ customer.postalCode || '--' }} {{ customer.city || '' }}</div>
            </div>
          </div>
        </ui-card>

        <div class="pt-5">
          <ui-card padding="sm">
            <div
              card-header
              class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <h2 class="text-h3 tracking-[-0.02em] text-text-main">Urządzenia</h2>

              <ui-button variant="secondary" size="sm" (pressed)="isAddDeviceModalOpen.set(true)">
                Dodaj urządzenie
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
                title="Brak urządzeń"
                description=""
                actionLabel="Dodaj urządzenie"
                (action)="isAddDeviceModalOpen.set(true)"
              />
            }
          </ui-card>
        </div>

        <app-customer-form-modal
          [open]="isEditCustomerModalOpen()"
          [initialValue]="editableCustomerDraft()"
          modalTitle="Edytuj klienta"
          modalDescription="Zaktualizuj dane klienta bez opuszczania widoku szczegółów."
          submitLabel="Zapisz zmiany"
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
          modalTitle="Edytuj urządzenie"
          submitLabel="Zapisz zmiany"
          (close)="closeEditDeviceModal()"
          (save)="handleUpdateDevice($event)"
        />
      } @else {
        <ui-empty-state
          title="Nie znaleźliśmy tego klienta"
          description="Profil może jeszcze nie istnieć albo identyfikator jest nieprawidłowy."
          actionLabel="Wróć do listy klientów"
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

  protected readonly isEditCustomerModalOpen = signal(false);
  protected readonly isAddDeviceModalOpen = signal(false);
  protected readonly isEditDeviceModalOpen = signal(false);
  protected readonly editingDeviceId = signal<string | null>(null);
  protected readonly customerId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
    {
      initialValue: this.route.snapshot.paramMap.get('id') ?? '',
    },
  );

  protected readonly customer = computed(() =>
    this.customersStore.getCustomerById(this.customerId()),
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

  protected customerTitle(customer: Customer): string {
    return customer.companyName || customer.fullName || 'Nowy klient';
  }

  protected customerSubtitle(customer: Customer): string {
    const customerTypeLabel =
      customer.type === 'company' ? 'Firma i osoba kontaktowa' : 'Osoba prywatna';
    const contactLabel = customer.fullName || 'Brak osoby kontaktowej';

    return `${customerTypeLabel} - ${contactLabel}`;
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

  protected handleAddDevice(device: DeviceDraft): void {
    const customer = this.customer();

    if (!customer) {
      return;
    }

    this.customersStore.addDevice(customer.id, device);
    this.isAddDeviceModalOpen.set(false);
  }

  protected handleEditDevice(device: Device): void {
    this.editingDeviceId.set(device.id);
    this.isEditDeviceModalOpen.set(true);
  }

  protected handleUpdateDevice(deviceDraft: DeviceDraft): void {
    const customer = this.customer();
    const editingDeviceId = this.editingDeviceId();

    if (!customer || !editingDeviceId) {
      return;
    }

    this.customersStore.updateDevice(customer.id, editingDeviceId, deviceDraft);
    this.closeEditDeviceModal();
  }

  protected handleDeviceSelected(customerId: string, device: Device): void {
    void this.router.navigate(['/customers', customerId, 'devices', device.id]);
  }

  protected closeEditDeviceModal(): void {
    this.isEditDeviceModalOpen.set(false);
    this.editingDeviceId.set(null);
  }
}
