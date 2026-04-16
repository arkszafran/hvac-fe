import { Injectable, computed, inject } from '@angular/core';

import { CustomersStore } from '../../customers/data/customers.store';
import { Device } from '../models/device.model';

@Injectable({ providedIn: 'root' })
export class DevicesStore {
  private readonly customersStore = inject(CustomersStore);

  readonly devices = computed<Device[]>(() =>
    this.customersStore.customers().flatMap((customer) =>
      customer.devices.map((device) => ({
        ...device,
        customer,
      })),
    ),
  );

  getDeviceById(deviceId: string): Device | undefined {
    return this.devices().find((device) => device.id === deviceId);
  }
}
