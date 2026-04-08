export type CustomerType = 'company' | 'individual';

export interface Customer {
  id: string;
  type: CustomerType;
  companyName: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  postalCode: string;
  city: string;
}
