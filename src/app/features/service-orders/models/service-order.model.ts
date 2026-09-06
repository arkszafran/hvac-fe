import type { Device } from '../../customers/models/device.model';
import type { PhotoAttachment } from '../../../common/models/photo-attachment.model';

export type ServiceOrderType = 'installation' | 'repair' | 'inspection';
export type ServiceOrderSource = 'customer-panel' | 'website-form' | 'user' | 'system';
export type ServiceOrderStatus =
  | 'new'
  | 'contact_required'
  | 'scheduled'
  | 'completed'
  | 'cancelled';
export type ServiceOrderCustomerType = 'company' | 'individual';
export type ServiceOrderBuildingType = 'apartment-block' | 'house' | 'office-building';
export type ServiceOrderOutdoorUnitPlace = 'wall' | 'balcony' | 'roof';
export type CustomerConfirmationStatus = 'pending' | 'confirmed' | 'not_confirmed';

export interface ServiceOrderAssignee {
  name: string;
  email: string;
}

export type ServiceOrderAttachment = PhotoAttachment;

export interface ServiceOrderCustomer {
  customerId?: string;
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

type ServiceOrderDeviceCharacteristics = Pick<
  Device,
  'type' | 'brand' | 'model' | 'serialNumber' | 'refrigerant' | 'refrigerantAmount'
>;

export interface ServiceOrderDevice extends ServiceOrderDeviceCharacteristics {
  id: string;
  systemDeviceId?: string;
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
  confirmationReminderSentAt?: string;
}

export type ServiceOrderData =
  | InstallationServiceOrderData
  | RepairServiceOrderData
  | InspectionServiceOrderData;

export interface ServiceOrder extends ServiceOrderCustomer {
  id: string;
  type: ServiceOrderType;
  source: ServiceOrderSource;
  status: ServiceOrderStatus;
  serviceData: ServiceOrderData;
  orderDate: string;
  scheduledAt: string;
  nextContactAt?: string;
  assignee?: ServiceOrderAssignee;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceOrderNote {
  id: string;
  serviceOrderId: string;
  content: string;
  photos: PhotoAttachment[];
  authorId: string;
  createdAt: string;
  updatedAt?: string;
}
