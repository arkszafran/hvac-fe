import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { UiButtonComponent, UiIconComponent } from '../../ui';
import { Customer } from '../customers/models/customer.model';
import { DeviceCustomerModalComponent } from './components/device-customer-modal.component';
import { DeviceTableComponent } from './components/device-table.component';
import { DeviceToolbarComponent } from './components/device-toolbar.component';
import { DevicesStore } from './data/devices.store';
import { matchesDeviceSearch } from './utils/device-search.util';

@Component({
  selector: 'app-devices-view',
  imports: [
    TranslocoPipe,
    UiButtonComponent,
    UiIconComponent,
    DeviceCustomerModalComponent,
    DeviceTableComponent,
    DeviceToolbarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './devices-view.component.html',
})
export class DevicesViewComponent {
  private readonly router = inject(Router);
  private readonly devicesStore = inject(DevicesStore);

  protected readonly devices = this.devicesStore.devices;
  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly selectedCustomer = signal<Customer | null>(null);
  private readonly searchQuery = toSignal(this.searchControl.valueChanges, { initialValue: '' });

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
