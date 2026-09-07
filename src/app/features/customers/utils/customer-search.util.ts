interface CustomerSearchData {
  type: string;
  companyName: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  postalCode: string;
  city: string;
}

const SEARCH_FIELDS: Array<keyof CustomerSearchData> = [
  'type',
  'companyName',
  'fullName',
  'phone',
  'email',
  'address',
  'postalCode',
  'city',
];

export function normalizeCustomerSearch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l');
}

export function matchesCustomerSearch(customer: CustomerSearchData, query: string): boolean {
  const normalizedQuery = normalizeCustomerSearch(query);

  if (!normalizedQuery) {
    return true;
  }

  const searchableText = SEARCH_FIELDS.map((field) => customer[field]).join(' ');

  return normalizeCustomerSearch(searchableText).includes(normalizedQuery);
}
