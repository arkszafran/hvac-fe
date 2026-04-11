import { Injectable, signal } from '@angular/core';

import { Customer, CustomerDraft } from '../models/customer.model';
import { Device, DeviceDraft } from '../models/device.model';
import { CUSTOMER_MOCKS } from './customer.mock';

@Injectable({ providedIn: 'root' })
export class CustomersStore {
  private readonly customersState = signal<Customer[]>(CUSTOMER_MOCKS);

  readonly customers = this.customersState.asReadonly();

  getCustomerById(id: string): Customer | undefined {
    return this.customersState().find((customer) => customer.id === id);
  }

  getDeviceById(customerId: string, deviceId: string): Device | undefined {
    return this.getCustomerById(customerId)?.devices.find((device) => device.id === deviceId);
  }

  addCustomer(draft: CustomerDraft): Customer {
    const customer: Customer = {
      id: createEntityId('customer'),
      devices: [],
      ...normalizeCustomerDraft(draft),
    };

    this.customersState.update((customers) => [customer, ...customers]);

    return customer;
  }

  updateCustomer(customerId: string, draft: CustomerDraft): Customer | undefined {
    let updatedCustomer: Customer | undefined;

    this.customersState.update((customers) =>
      customers.map((customer) => {
        if (customer.id !== customerId) {
          return customer;
        }

        updatedCustomer = {
          ...customer,
          ...normalizeCustomerDraft(draft),
        };

        return updatedCustomer;
      }),
    );

    return updatedCustomer;
  }

  addDevice(customerId: string, draft: DeviceDraft): Device | undefined {
    let createdDevice: Device | undefined;

    this.customersState.update((customers) =>
      customers.map((customer) => {
        if (customer.id !== customerId) {
          return customer;
        }

        const device: Device = {
          id: createEntityId('device'),
          ...normalizeDeviceDraft(draft),
        };

        createdDevice = device;

        return {
          ...customer,
          devices: [device, ...customer.devices],
        };
      }),
    );

    return createdDevice;
  }

  updateDevice(customerId: string, deviceId: string, draft: DeviceDraft): Device | undefined {
    let updatedDevice: Device | undefined;

    this.customersState.update((customers) =>
      customers.map((customer) => {
        if (customer.id !== customerId) {
          return customer;
        }

        return {
          ...customer,
          devices: customer.devices.map((device) => {
            if (device.id !== deviceId) {
              return device;
            }

            updatedDevice = {
              id: device.id,
              ...normalizeDeviceDraft(draft),
            };

            return updatedDevice;
          }),
        };
      }),
    );

    return updatedDevice;
  }

  updateDeviceNextInspectionDate(
    customerId: string,
    deviceId: string,
    nextInspectionDate: string,
  ): Device | undefined {
    let updatedDevice: Device | undefined;

    this.customersState.update((customers) =>
      customers.map((customer) => {
        if (customer.id !== customerId) {
          return customer;
        }

        return {
          ...customer,
          devices: customer.devices.map((device) => {
            if (device.id !== deviceId) {
              return device;
            }

            updatedDevice = {
              ...device,
              nextInspectionDate: nextInspectionDate.trim(),
            };

            return updatedDevice;
          }),
        };
      }),
    );

    return updatedDevice;
  }
}

function normalizeCustomerDraft(draft: CustomerDraft): CustomerDraft {
  return {
    type: draft.type,
    companyName: draft.type === 'company' ? draft.companyName.trim() : '',
    fullName: draft.fullName.trim(),
    phone: draft.phone.trim(),
    email: draft.email.trim(),
    address: draft.address.trim(),
    postalCode: draft.postalCode.trim(),
    city: draft.city.trim(),
  };
}

function normalizeDeviceDraft(draft: DeviceDraft): Omit<Device, 'id'> {
  const hasCustomInstallationAddress = draft.hasCustomInstallationAddress;
  const warrantyMonths = Math.max(0, draft.warrantyMonths);
  const installationDate = draft.installationDate.trim();

  return {
    type: draft.type,
    brand: draft.brand.trim(),
    model: draft.model.trim(),
    serialNumber: draft.serialNumber.trim(),
    installationDate,
    warrantyMonths,
    warrantyUntil: calculateWarrantyUntil(installationDate, warrantyMonths),
    nextInspectionDate: draft.nextInspectionDate,
    note: draft.note.trim(),
    refrigerant: draft.refrigerant.trim(),
    refrigerantAmount: draft.refrigerantAmount.trim(),
    location: draft.location.trim(),
    hasCustomInstallationAddress,
    address: hasCustomInstallationAddress ? draft.address.trim() : '',
    postalCode: hasCustomInstallationAddress ? draft.postalCode.trim() : '',
    city: hasCustomInstallationAddress ? draft.city.trim() : '',
    serviceHistory: draft.serviceHistory,
  };
}

function createEntityId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function calculateWarrantyUntil(installationDate: string, warrantyMonths: number): string {
  if (!installationDate || warrantyMonths <= 0) {
    return '';
  }

  const parsedDate = parseDateInput(installationDate);

  if (!parsedDate) {
    return '';
  }

  parsedDate.setMonth(parsedDate.getMonth() + warrantyMonths);

  return formatDateInput(parsedDate);
}

function parseDateInput(value: string): Date | null {
  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const date = new Date(year, month - 1, day);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}
