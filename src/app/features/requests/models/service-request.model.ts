import type { DeviceType } from '../../customers/models/device.model';

export type ServiceRequestType = 'installation' | 'repair' | 'inspection';
export type ServiceRequestSource = 'customer-panel' | 'website-form';
export type ServiceRequestStatus = 'new' | 'scheduled' | 'completed' | 'cancelled';
export type ServiceRequestCustomerType = 'company' | 'individual';
export type ServiceRequestBuildingType = 'apartment-block' | 'house' | 'office-building';
export type ServiceRequestOutdoorUnitPlace = 'wall' | 'balcony';

export interface ServiceRequestAttachment {
  id: string;
  fileName: string;
  url: string;
  description?: string;
}

export interface ServiceRequestCustomer {
  systemCustomerId?: string;
  customerType: ServiceRequestCustomerType;
  fullName: string;
  companyName: string;
  phone: string;
  email: string;
  address: string;
  postalCode: string;
  city: string;
}

export interface ServiceRequestRoom {
  id: string;
  area: number;
  height: number;
  outdoorUnitPlace: ServiceRequestOutdoorUnitPlace;
  estimatedDistanceToOutdoorUnit: number;
  floor: number;
  photos: ServiceRequestAttachment[];
}

export interface ServiceRequestDevice {
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
  nameplatePhotos: ServiceRequestAttachment[];
}

export interface ServiceRequestBase {
  id: string;
  source: ServiceRequestSource;
  requestType: ServiceRequestType;
  customer: ServiceRequestCustomer;
  note: string;
  status: ServiceRequestStatus;
  appointmentDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface InstallationServiceRequest extends ServiceRequestBase {
  requestType: 'installation';
  installation: {
    buildingType: ServiceRequestBuildingType;
    rooms: ServiceRequestRoom[];
    photos: ServiceRequestAttachment[];
  };
}

export interface RepairServiceRequest extends ServiceRequestBase {
  requestType: 'repair';
  repair: {
    devices: ServiceRequestDevice[];
  };
}

export interface InspectionServiceRequest extends ServiceRequestBase {
  requestType: 'inspection';
  inspection: {
    devices: ServiceRequestDevice[];
  };
}

export type ServiceRequest =
  | InstallationServiceRequest
  | RepairServiceRequest
  | InspectionServiceRequest;
