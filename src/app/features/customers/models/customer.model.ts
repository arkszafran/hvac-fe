export type CustomerType = 'firma' | 'osoba prywatna';

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
