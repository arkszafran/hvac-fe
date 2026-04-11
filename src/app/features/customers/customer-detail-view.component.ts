import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';

import {
  UiButtonComponent,
  UiCardComponent,
  UiEmptyStateComponent,
} from '../../ui';
import { DeviceListComponent } from './components/device-list.component';
import { DeviceFormModalComponent } from './components/device-form-modal.component';
import { CustomersStore } from './data/customers.store';
import { Customer } from './models/customer.model';
import { Device, DeviceDraft } from './models/device.model';

@Component({
  selector: 'app-customer-detail-view',
  standalone: true,
  imports: [
    UiButtonComponent,
    UiCardComponent,
    UiEmptyStateComponent,
    DeviceListComponent,
    DeviceFormModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8">
      @if (customer(); as customer) {
        <section class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div class="space-y-1">
            <h1 class="text-display tracking-[-0.04em] text-text-main">
              {{ customerTitle(customer) }}
            </h1>
            <p class="text-body text-text-muted">{{ customerSubtitle(customer) }}</p>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <ui-button variant="secondary" size="sm" (pressed)="navigateToCustomers()">
              Wróć do listy
            </ui-button>

            <ui-button size="sm" (pressed)="isDeviceModalOpen.set(true)">
              <span button-icon>
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d="M10 4.5V15.5M4.5 10H15.5"
                    stroke="currentColor"
                    stroke-width="1.7"
                    stroke-linecap="round"
                  />
                </svg>
              </span>
              Dodaj urządzenie
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

              <ui-button variant="secondary" size="sm" (pressed)="isDeviceModalOpen.set(true)">
                Dodaj urządzenie
              </ui-button>
            </div>

            @if (customer.devices.length) {
              <app-device-list
                [devices]="customer.devices"
                (deviceSelected)="handleDeviceSelected(customer.id, $event)"
              />
            } @else {
              <ui-empty-state
                title="Brak urządzeń"
                description=""
                actionLabel="Dodaj urządzenie"
                (action)="isDeviceModalOpen.set(true)"
              />
            }
          </ui-card>
        </div>

        <app-device-form-modal
          [open]="isDeviceModalOpen()"
          (close)="isDeviceModalOpen.set(false)"
          (save)="handleAddDevice($event)"
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

  protected readonly isDeviceModalOpen = signal(false);
  protected readonly customerId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
    {
      initialValue: this.route.snapshot.paramMap.get('id') ?? '',
    },
  );

  protected readonly customer = computed(() =>
    this.customersStore.getCustomerById(this.customerId()),
  );

  protected customerTitle(customer: Customer): string {
    return customer.companyName || customer.fullName || 'Nowy klient';
  }

  protected customerSubtitle(customer: Customer): string {
    const customerTypeLabel =
      customer.type === 'company' ? 'Firma i osoba kontaktowa' : 'Osoba prywatna';
    const contactLabel = customer.fullName || 'Brak osoby kontaktowej';

    return `${customerTypeLabel} - ${contactLabel}`;
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
    this.isDeviceModalOpen.set(false);
  }

  protected handleDeviceSelected(customerId: string, device: Device): void {
    void this.router.navigate(['/customers', customerId, 'devices', device.id]);
  }
}
