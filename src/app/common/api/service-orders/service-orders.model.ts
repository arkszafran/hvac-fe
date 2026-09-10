import { ApiSuccessResponse } from '../api-response.model';
import { AttachmentScanStatus } from '../attachments/attachments.model';
import { CustomerType, PaginationResponseDto } from '../customers/customers.model';
import { DeviceType } from '../devices/devices.model';

export type ServiceOrderType = 'installation' | 'repair' | 'inspection';
export type ServiceOrderSource = 'customer_panel' | 'website_form' | 'user' | 'system';
export type ServiceOrderStatus =
  | 'new'
  | 'contact_required'
  | 'scheduled'
  | 'completed'
  | 'cancelled';
export type ServiceOrderSortBy = 'orderDate' | 'scheduledAt' | 'createdAt' | 'updatedAt';
export type ServiceOrderSortDirection = 'asc' | 'desc';
export type CustomerConfirmationStatus = 'pending' | 'confirmed' | 'not_confirmed';
export type ServiceOrderBuildingType = 'apartment_block' | 'house' | 'office_building';
export type ServiceOrderOutdoorUnitPlace = 'wall' | 'balcony' | 'roof';

export interface ServiceOrderDto {
  id: string;
  customerId: string | null;
  type: ServiceOrderType;
  source: ServiceOrderSource;
  status: ServiceOrderStatus;
  assigneeUserId: string | null;
  orderDate: string;
  scheduledAt: string | null;
  nextContactAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type InspectionServiceOrderDto = ServiceOrderDto;

export interface ServiceOrderCustomerDto {
  customerId: string | null;
  type: CustomerType;
  companyName: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  postalCode: string;
  city: string;
}

export interface ServiceOrderAssigneeDto {
  id: string;
  name: string;
  email: string;
}

export interface ServiceOrderDeviceDto {
  id: string;
  deviceId: string | null;
  type: DeviceType;
  brand: string;
  model: string;
  serialNumber: string;
  refrigerant: string;
  refrigerantAmount: string;
  displayedError: string | null;
  location: string;
  hasCustomInstallationAddress: boolean;
  address: string;
  postalCode: string;
  city: string;
}

export interface ServiceOrderListItemDto {
  order: ServiceOrderDto;
  customer: ServiceOrderCustomerDto;
  assignee: ServiceOrderAssigneeDto | null;
  devices: ServiceOrderDeviceDto[];
}

export interface ServiceOrdersListQueryDto {
  customerId?: string;
  type?: ServiceOrderType;
  statuses?: readonly ServiceOrderStatus[];
  active?: boolean;
  excludeDeviceId?: string;
  q?: string;
  page?: number;
  pageSize?: number;
  sortBy?: ServiceOrderSortBy;
  sortDirection?: ServiceOrderSortDirection;
}

export type ServiceOrdersPaginationDto = PaginationResponseDto;

export interface ServiceOrdersListDataDto {
  items: ServiceOrderListItemDto[];
  pagination: ServiceOrdersPaginationDto;
}

export type ServiceOrdersListResponseDto = ApiSuccessResponse<ServiceOrdersListDataDto>;

export interface ServiceOrderDetailsQueryDto {
  /**
   * When true, attachment arrays are omitted and `attachmentsOmitted` is true.
   * Defaults to false; the backend then returns short-lived URLs for every attachment.
   */
  ommitAttachments?: boolean;
}

export interface ServiceOrderAttachmentDto {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  status: AttachmentScanStatus;
  description: string | null;
  url: string;
  urlExpiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceOrderRoomBaseDto {
  id: string;
  area: number;
  height: number;
  outdoorUnitPlace: ServiceOrderOutdoorUnitPlace;
  estimatedDistanceToOutdoorUnit: number;
  floor: number;
}

export interface ServiceOrderRoomWithAttachmentsDto extends ServiceOrderRoomBaseDto {
  photos: ServiceOrderAttachmentDto[];
}

export type ServiceOrderDeviceDetailsBaseDto = ServiceOrderDeviceDto;

export interface ServiceOrderDeviceWithAttachmentsDto extends ServiceOrderDeviceDto {
  nameplatePhotos: ServiceOrderAttachmentDto[];
}

export interface ServiceOrderNoteAuthorDto {
  id: string;
  name: string;
}

export interface ServiceOrderNoteBaseDto {
  id: string;
  content: string;
  author: ServiceOrderNoteAuthorDto;
  createdAt: string;
  updatedAt: string | null;
}

export interface ServiceOrderNoteWithAttachmentsDto extends ServiceOrderNoteBaseDto {
  photos: ServiceOrderAttachmentDto[];
}

export interface InstallationServiceOrderDataWithAttachmentsDto {
  type: 'installation';
  buildingType: ServiceOrderBuildingType;
  rooms: ServiceOrderRoomWithAttachmentsDto[];
  photos: ServiceOrderAttachmentDto[];
}

export interface RepairServiceOrderDataWithAttachmentsDto {
  type: 'repair';
  devices: ServiceOrderDeviceWithAttachmentsDto[];
}

export interface InspectionServiceOrderDataWithAttachmentsDto {
  type: 'inspection';
  devices: ServiceOrderDeviceWithAttachmentsDto[];
  customerConfirmationStatus: CustomerConfirmationStatus;
  confirmationReminderSentAt: string | null;
}

export type ServiceOrderDataWithAttachmentsDto =
  | InstallationServiceOrderDataWithAttachmentsDto
  | RepairServiceOrderDataWithAttachmentsDto
  | InspectionServiceOrderDataWithAttachmentsDto;

export interface InstallationServiceOrderDataWithoutAttachmentsDto {
  type: 'installation';
  buildingType: ServiceOrderBuildingType;
  rooms: ServiceOrderRoomBaseDto[];
}

export interface RepairServiceOrderDataWithoutAttachmentsDto {
  type: 'repair';
  devices: ServiceOrderDeviceDetailsBaseDto[];
}

export interface InspectionServiceOrderDataWithoutAttachmentsDto {
  type: 'inspection';
  devices: ServiceOrderDeviceDetailsBaseDto[];
  customerConfirmationStatus: CustomerConfirmationStatus;
  confirmationReminderSentAt: string | null;
}

export type ServiceOrderDataWithoutAttachmentsDto =
  | InstallationServiceOrderDataWithoutAttachmentsDto
  | RepairServiceOrderDataWithoutAttachmentsDto
  | InspectionServiceOrderDataWithoutAttachmentsDto;

interface ServiceOrderDetailsBaseDto {
  order: ServiceOrderDto;
  customer: ServiceOrderCustomerDto;
  assignee: ServiceOrderAssigneeDto | null;
}

export interface ServiceOrderDetailsWithAttachmentsDto extends ServiceOrderDetailsBaseDto {
  attachmentsOmitted: false;
  serviceData: ServiceOrderDataWithAttachmentsDto;
  notes: ServiceOrderNoteWithAttachmentsDto[];
}

export interface ServiceOrderDetailsWithoutAttachmentsDto extends ServiceOrderDetailsBaseDto {
  attachmentsOmitted: true;
  serviceData: ServiceOrderDataWithoutAttachmentsDto;
  notes: ServiceOrderNoteBaseDto[];
}

export type ServiceOrderDetailsDto =
  | ServiceOrderDetailsWithAttachmentsDto
  | ServiceOrderDetailsWithoutAttachmentsDto;

export type ServiceOrderDetailsResponseDto = ApiSuccessResponse<ServiceOrderDetailsDto>;
