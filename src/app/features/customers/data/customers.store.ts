import { Injectable, signal } from '@angular/core';

import type { Visit } from '../../visits/models/visit.model';
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
          visits: [],
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

  saveDeviceWithCustomer(
    customerSelection: { customerId: string } | { customerDraft: CustomerDraft },
    deviceDraft: DeviceDraft,
  ): { customer: Customer; device: Device } | undefined {
    let result: { customer: Customer; device: Device } | undefined;

    this.customersState.update((customers) => {
      const device: Device = {
        id: createEntityId('device'),
        ...normalizeDeviceDraft(deviceDraft),
        visits: [],
      };

      if ('customerId' in customerSelection) {
        return customers.map((customer) => {
          if (customer.id !== customerSelection.customerId) {
            return customer;
          }

          const updatedCustomer: Customer = {
            ...customer,
            devices: [device, ...customer.devices],
          };

          result = {
            customer: updatedCustomer,
            device,
          };

          return updatedCustomer;
        });
      }

      const createdCustomer: Customer = {
        id: createEntityId('customer'),
        devices: [device],
        ...normalizeCustomerDraft(customerSelection.customerDraft),
      };

      result = {
        customer: createdCustomer,
        device,
      };

      return [createdCustomer, ...customers];
    });

    return result;
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
              ...device,
              ...normalizeDeviceDraft(draft),
            };

            return updatedDevice;
          }),
        };
      }),
    );

    return updatedDevice;
  }

  addVisitToDevices(visit: Visit): void {
    this.customersState.update((customers) =>
      customers.map((customer) => {
        if (customer.id !== visit.customerId) {
          return customer;
        }

        return {
          ...customer,
          devices: customer.devices.map((device) =>
            visit.devicesList.includes(device.id)
              ? { ...device, visits: [visit, ...device.visits] }
              : device,
          ),
        };
      }),
    );
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

function normalizeDeviceDraft(draft: DeviceDraft): Omit<Device, 'id' | 'visits'> {
  const hasCustomInstallationAddress = draft.hasCustomInstallationAddress;
  const warrantyMonths = Math.max(0, draft.warrantyMonths);
  const installationDate = draft.installationDate.trim();

  return {
    type: draft.type,
    brand: draft.brand.trim(),
    model: draft.model.trim(),
    powerKw: normalizePowerKw(draft.powerKw),
    serialNumber: draft.serialNumber.trim(),
    installationDate,
    warrantyMonths,
    warrantyUntil: calculateWarrantyUntil(installationDate, warrantyMonths),
    note: draft.note.trim(),
    refrigerant: draft.refrigerant.trim(),
    refrigerantAmount: draft.refrigerantAmount.trim(),
    location: draft.location.trim(),
    hasCustomInstallationAddress,
    address: hasCustomInstallationAddress ? draft.address.trim() : '',
    postalCode: hasCustomInstallationAddress ? draft.postalCode.trim() : '',
    city: hasCustomInstallationAddress ? draft.city.trim() : '',
  };
}

function normalizePowerKw(powerKw: number | null): number | null {
  if (powerKw === null || !Number.isFinite(powerKw)) {
    return null;
  }

  return Math.max(0, powerKw);
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
