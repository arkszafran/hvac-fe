export interface CustomerContactData {
  companyName: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  postalCode: string;
  city: string;
}

export function formatCustomerName(customer: CustomerContactData): string {
  return customer.companyName || customer.fullName || '--';
}

export function formatCustomerAddress(customer: CustomerContactData): string {
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

export function customerMapHref(customer: CustomerContactData): string {
  const address = [customer.address, `${customer.postalCode} ${customer.city}`.trim()]
    .filter(Boolean)
    .join(', ');

  return address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : '';
}
