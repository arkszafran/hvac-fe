import { Customer } from '../../customers/models/customer.model';
import { Device as CustomerDevice } from '../../customers/models/device.model';

export interface Device extends CustomerDevice {
  customer: Customer;
}

export function getDeviceCustomerName(device: Device): string {
  return device.customer.companyName || device.customer.fullName || '--';
}

export function getDeviceCustomerDescription(device: Device): string {
  if (device.customer.companyName && device.customer.fullName) {
    return device.customer.fullName;
  }

  return device.customer.email || device.customer.phone || '--';
}

export function getDeviceInstallationAddress(device: Device): string {
  const addressParts = device.hasCustomInstallationAddress
    ? [device.address, `${device.postalCode} ${device.city}`.trim()]
    : [
        device.customer.address,
        `${device.customer.postalCode} ${device.customer.city}`.trim(),
      ];

  return addressParts.filter(Boolean).join(', ') || '--';
}

export function getDeviceInstallationAddressDetails(device: Device): string {
  if (device.location) {
    return device.location;
  }

  return device.hasCustomInstallationAddress ? 'Adres niestandardowy' : 'Adres klienta';
}
