import { Customer } from '../models/customer.model';

export function formatCustomerName(customer: Customer): string {
  return customer.companyName || customer.fullName || '--';
}

export function formatCustomerAddress(customer: Customer): string {
  return (
    [customer.address, `${customer.postalCode} ${customer.city}`.trim()]
      .filter(Boolean)
      .join(', ') || '--'
  );
}

export function customerPhoneHref(phone: string): string {
  const normalizedPhone = phone.replace(/[^\d+]/g, '');

  return normalizedPhone ? `tel:${normalizedPhone}` : '#';
}

export function customerEmailHref(email: string): string {
  const normalizedEmail = email.trim();

  return normalizedEmail ? `mailto:${normalizedEmail}` : '#';
}

export function customerMapHref(customer: Customer): string {
  const address = [customer.address, `${customer.postalCode} ${customer.city}`.trim()]
    .filter(Boolean)
    .join(', ');

  return address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : '';
}
