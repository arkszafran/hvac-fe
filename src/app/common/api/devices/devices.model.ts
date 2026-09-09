import { ApiSuccessResponse } from '../api-response.model';
import { CustomerType, PaginationResponseDto } from '../customers/customers.model';
import {
  InspectionServiceOrderDto,
  ServiceOrderType,
} from '../service-orders/service-orders.model';

export type DeviceType = 'air_conditioning' | 'heat_pump' | 'ventilation';
export type CreateDeviceServiceOrderAction = 'create_inspection' | 'attach_inspection';
export type UpdateDeviceServiceOrderAction =
  | CreateDeviceServiceOrderAction
  | 'detach_inspection'
  | 'reschedule_inspection'
  | 'move_to_new_inspection';

export interface DevicesListQueryDto {
  q?: string;
  page?: number;
}

export interface CustomerSummaryDto {
  id: string;
  type: CustomerType;
  companyName: string | null;
  fullName: string | null;
  phone: string;
  email: string;
  address: string;
  postalCode: string;
  city: string;
}

export interface DeviceDto {
  id: string;
  customerId: string;
  type: DeviceType;
  brand: string;
  model: string;
  powerKw: number | null;
  serialNumber: string;
  installationDate: string;
  warrantyMonths: number;
  warrantyUntil: string;
  note: string;
  refrigerant: string;
  refrigerantAmount: string;
  location: string;
  hasCustomInstallationAddress: boolean;
  address: string;
  postalCode: string;
  city: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceListItemDto {
  id: string;
  customerId: string;
  type: DeviceType;
  brand: string;
  model: string;
  location: string;
  hasCustomInstallationAddress: boolean;
  address: string;
  postalCode: string;
  city: string;
  customer: CustomerSummaryDto;
}

export interface ClientFilteredDevicesDto {
  filteringMode: 'client';
  items: DeviceListItemDto[];
  totalItems: number;
}

export interface ServerFilteredDevicesDto {
  filteringMode: 'server';
  items: DeviceListItemDto[];
  pagination: PaginationResponseDto;
}

export type DevicesListDataDto = ClientFilteredDevicesDto | ServerFilteredDevicesDto;
export type DevicesListResponseDto = ApiSuccessResponse<DevicesListDataDto>;

export interface PhotoAttachmentDto {
  id: string;
  fileName: string;
  url: string;
  description?: string;
}

export interface DeviceVisitDto {
  id: string;
  deviceId: string;
  serviceOrderId?: string;
  customerId: string;
  userName: string;
  date: string;
  type: ServiceOrderType;
  note: string;
  photos: PhotoAttachmentDto[];
  createdAt: string;
}

export interface DeviceDetailsDto {
  customer: CustomerSummaryDto;
  device: DeviceDto;
  activeInspection: InspectionServiceOrderDto | null;
  visits: DeviceVisitDto[];
}

export type DeviceDetailsResponseDto = ApiSuccessResponse<DeviceDetailsDto>;

export interface CreateDeviceServiceOrderCommandDto {
  action: CreateDeviceServiceOrderAction;
  scheduledAt?: string;
  serviceOrderId?: string;
}

export interface CreateDeviceDto {
  type: DeviceType;
  brand: string;
  model: string;
  powerKw: number | null;
  serialNumber: string;
  installationDate: string;
  warrantyMonths: number;
  note: string;
  refrigerant: string;
  refrigerantAmount: string;
  location: string;
  hasCustomInstallationAddress: boolean;
  address: string;
  postalCode: string;
  city: string;
  customerId: string;
  serviceOrder?: CreateDeviceServiceOrderCommandDto;
}

export interface UpdateDeviceServiceOrderCommandDto {
  action: UpdateDeviceServiceOrderAction;
  serviceOrderId?: string;
  currentServiceOrderId?: string;
  scheduledAt?: string;
}

export type UpdateDeviceDto = Partial<Omit<CreateDeviceDto, 'customerId' | 'serviceOrder'>> & {
  serviceOrder?: UpdateDeviceServiceOrderCommandDto;
};

export interface DeviceMutationResultDto {
  device: DeviceDto;
}

export type CreateDeviceResponseDto = ApiSuccessResponse<DeviceMutationResultDto>;
export type UpdateDeviceResponseDto = ApiSuccessResponse<DeviceMutationResultDto>;
