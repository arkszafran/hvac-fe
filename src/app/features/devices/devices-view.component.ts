import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { UiButtonComponent } from '../../ui';
import { Customer } from '../customers/models/customer.model';
import { DeviceCustomerModalComponent } from './components/device-customer-modal.component';
import { DeviceTableComponent } from './components/device-table.component';
import { DeviceToolbarComponent } from './components/device-toolbar.component';
import { DevicesStore } from './data/devices.store';
import { matchesDeviceSearch } from './utils/device-search.util';

@Component({
  selector: 'app-devices-view',
  standalone: true,
  imports: [
    UiButtonComponent,
    DeviceCustomerModalComponent,
    DeviceTableComponent,
    DeviceToolbarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-3">
      <section class="pb-1">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h1 class="text-display tracking-[-0.04em] text-text-main">Urządzenia</h1>

          <div class="flex justify-start lg:justify-end">
            <ui-button size="lg" (pressed)="navigateToCreateDevice()">
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
        </div>
      </section>

      <app-device-toolbar [search]="searchQuery()" (searchChange)="searchQuery.set($event)" />

      <app-device-table
        [devices]="filteredDevices()"
        (devicePreviewRequested)="handleDevicePreview($event)"
        (customerPreviewRequested)="selectedCustomer.set($event)"
      />

      <app-device-customer-modal
        [open]="selectedCustomer() !== null"
        [customer]="selectedCustomer()"
        (close)="selectedCustomer.set(null)"
      />
    </div>
  `,
})
export class DevicesViewComponent {
  private readonly router = inject(Router);
  private readonly devicesStore = inject(DevicesStore);

  protected readonly devices = this.devicesStore.devices;
  protected readonly searchQuery = signal('');
  protected readonly selectedCustomer = signal<Customer | null>(null);

  protected readonly filteredDevices = computed(() => {
    const query = this.searchQuery();

    return this.devices().filter((device) => matchesDeviceSearch(device, query));
  });

  protected navigateToCreateDevice(): void {
    void this.router.navigate(['/devices/new']);
  }

  protected handleDevicePreview(device: { id: string }): void {
    void this.router.navigate(['/devices', device.id]);
  }
}
