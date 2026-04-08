import { Customer } from '../models/customer.model';

const SEARCH_FIELDS: Array<keyof Customer> = [
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
    .replace(/[\u0300-\u036f]/g, '');
}

export function matchesCustomerSearch(customer: Customer, query: string): boolean {
  const normalizedQuery = normalizeCustomerSearch(query);

  if (!normalizedQuery) {
    return true;
  }

  const searchableText = SEARCH_FIELDS.map((field) => customer[field]).join(' ');

  return normalizeCustomerSearch(searchableText).includes(normalizedQuery);
}
