import { Device } from '../models/device.model';
import { normalizeCustomerSearch } from '../../customers/utils/customer-search.util';

export function matchesDeviceSearch(device: Device, query: string): boolean {
  const normalizedQuery = normalizeCustomerSearch(query);

  if (!normalizedQuery) {
    return true;
  }

  return getSearchableFields(device).some((value) =>
    normalizeCustomerSearch(value).includes(normalizedQuery),
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
  ].filter((value): value is string => typeof value === 'string' && Boolean(value));
}
