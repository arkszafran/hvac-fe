import { Device } from '../models/device.model';

export function matchesDeviceSearch(device: Device, query: string): boolean {
  const normalizedQuery = query.trim().toLocaleLowerCase('pl-PL');

  if (!normalizedQuery) {
    return true;
  }

  return getSearchableFields(device).some((value) =>
    value.toLocaleLowerCase('pl-PL').includes(normalizedQuery),
  );
}

function getSearchableFields(device: Device): string[] {
  return [
    device.brand,
    device.model,
    device.location,
    device.address,
    device.postalCode,
    device.city,
    device.customer.companyName,
    device.customer.fullName,
    device.customer.phone,
    device.customer.email,
    device.customer.address,
    device.customer.postalCode,
    device.customer.city,
  ].filter(Boolean);
}
