import { ServiceOrderStatus } from './service-order.model';

export interface ServiceOrderCandidate {
  id: string;
  status: ServiceOrderStatus;
  scheduledAt: string | null;
  orderDate: string;
  deviceCount?: number;
  serviceData?: {
    type: string;
    deviceIds?: readonly string[];
  };
}

export interface ServiceOrderRelatedDevice {
  id: string;
  brand: string;
  model: string;
  address: string;
}
