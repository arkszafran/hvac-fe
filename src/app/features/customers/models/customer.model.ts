import { Device } from './device.model';

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
  devices: Device[];
}

export type CustomerDraft = Omit<Customer, 'id' | 'devices'>;

export function createEmptyCustomerDraft(): CustomerDraft {
  return {
    type: 'individual',
    companyName: '',
    fullName: '',
    phone: '',
    email: '',
    address: '',
    postalCode: '',
    city: '',
  };
}
