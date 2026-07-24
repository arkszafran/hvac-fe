import type { DeviceType } from '../../customers/models/device.model';

export type ServiceOrderType = 'installation' | 'repair' | 'inspection';
export type ServiceOrderSource = 'customer-panel' | 'website-form' | 'user';
export type ServiceOrderStatus =
  | 'new'
  | 'contact_required'
  | 'scheduled'
  | 'completed'
  | 'cancelled';
export type ServiceOrderCustomerType = 'company' | 'individual';
export type ServiceOrderBuildingType = 'apartment-block' | 'house' | 'office-building';
export type ServiceOrderOutdoorUnitPlace = 'wall' | 'balcony';
export type CustomerConfirmationStatus = 'pending' | 'confirmed' | 'not_confirmed';

export interface ServiceOrderAttachment {
  id: string;
  fileName: string;
  url: string;
  description?: string;
}

export interface ServiceOrderCustomer {
  systemCustomerId?: string;
  customerType: ServiceOrderCustomerType;
  fullName: string;
  companyName: string;
  phone: string;
  email: string;
  address: string;
  postalCode: string;
  city: string;
}

export interface ServiceOrderRoom {
  id: string;
  area: number;
  height: number;
  outdoorUnitPlace: ServiceOrderOutdoorUnitPlace;
  estimatedDistanceToOutdoorUnit: number;
  floor: number;
  photos: ServiceOrderAttachment[];
}

export interface ServiceOrderDevice {
  id: string;
  systemDeviceId?: string;
  type: DeviceType;
  brand: string;
  model: string;
  serialNumber: string;
  year: number | null;
  refrigerant: string;
  refrigerantAmount: string;
  displayedError?: string;
  nameplatePhotos: ServiceOrderAttachment[];
}

export interface InstallationServiceOrderData {
  type: 'installation';
  buildingType: ServiceOrderBuildingType;
  rooms: ServiceOrderRoom[];
  photos: ServiceOrderAttachment[];
}

export interface RepairServiceOrderData {
  type: 'repair';
  devices: ServiceOrderDevice[];
}

export interface InspectionServiceOrderData {
  type: 'inspection';
  deviceIds: string[];
  devices: ServiceOrderDevice[];
  customerConfirmationStatus: CustomerConfirmationStatus;
}

export type ServiceOrderData =
  | InstallationServiceOrderData
  | RepairServiceOrderData
  | InspectionServiceOrderData;

export interface ServiceOrder {
  id: string;
  type: ServiceOrderType;
  source: ServiceOrderSource;
  status: ServiceOrderStatus;
  customer: ServiceOrderCustomer;
  serviceData: ServiceOrderData;
  scheduledAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceOrderNote {
  id: string;
  serviceOrderId: string;
  content: string;
  authorId: string;
  createdAt: string;
  updatedAt?: string;
}
