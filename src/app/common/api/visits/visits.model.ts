import { ApiSuccessResponse } from '../api-response.model';
import { AttachmentContentType, AttachmentUploadFormDto } from '../attachments/attachments.model';
import { CustomerType, PaginationResponseDto } from '../customers/customers.model';
import { DeviceType } from '../devices/devices.model';
import {
  ServiceOrderDto,
  ServiceOrderSource,
  ServiceOrderType,
} from '../service-orders/service-orders.model';

export type VisitType = ServiceOrderType;
export type VisitSortBy = 'performedOn' | 'createdAt';
export type VisitSortDirection = 'asc' | 'desc';

export interface VisitsListQueryDto {
  q?: string;
  page?: number;
  pageSize?: number;
  sortBy?: VisitSortBy;
  sortDirection?: VisitSortDirection;
}

export interface VisitUserSummaryDto {
  id: string;
  name: string;
}

export interface VisitCustomerSummaryDto {
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

export interface VisitDeviceSummaryDto {
  id: string;
  type: DeviceType;
  brand: string;
  model: string;
  location: string;
  hasCustomInstallationAddress: boolean;
  address: string;
  postalCode: string;
  city: string;
}

export interface VisitDeviceDto {
  device: VisitDeviceSummaryDto;
  note: string;
}

export interface VisitListItemDto {
  id: string;
  serviceOrderId: string | null;
  type: VisitType;
  performedOn: string;
  handledBy: VisitUserSummaryDto;
  customer: VisitCustomerSummaryDto;
  devices: VisitDeviceDto[];
  createdAt: string;
}

export type VisitsPaginationDto = PaginationResponseDto;

export interface VisitsListDataDto {
  items: VisitListItemDto[];
  pagination: VisitsPaginationDto;
}

export type VisitsListResponseDto = ApiSuccessResponse<VisitsListDataDto>;

export interface ExistingVisitCustomerCommandDto {
  kind: 'existing';
  customerId: string;
}

export interface CreateVisitCustomerDto {
  type: CustomerType;
  companyName: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  postalCode: string;
  city: string;
}

export interface CreateVisitCustomerCommandDto {
  kind: 'create';
  customer: CreateVisitCustomerDto;
}

export type VisitCustomerCommandDto =
  | ExistingVisitCustomerCommandDto
  | CreateVisitCustomerCommandDto;

export interface ExistingVisitDeviceCommandDto {
  kind: 'existing';
  deviceId: string;
  visitNote: string;
}

export interface CreateVisitDeviceDataDto {
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
}

export interface CreateVisitDeviceCommandDto {
  kind: 'create';
  device: CreateVisitDeviceDataDto;
  visitNote: string;
}

export type VisitDeviceCommandDto = ExistingVisitDeviceCommandDto | CreateVisitDeviceCommandDto;

export interface ScheduleNextInspectionDto {
  scheduledAt: string;
}

export interface CreateVisitAttachmentDto {
  fileName: string;
  contentType: AttachmentContentType;
  sizeBytes: number;
  description?: string | null;
  clientFileId: string;
}

export interface CreateVisitDto {
  type: VisitType;
  performedOn: string;
  serviceOrderId: string | null;
  customer: VisitCustomerCommandDto;
  devices: VisitDeviceCommandDto[];
  nextInspection: ScheduleNextInspectionDto | null;
  attachments: CreateVisitAttachmentDto[];
}

export interface PendingAttachmentDto {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  description: string | null;
  status: 'pending_upload';
  url: null;
  createdAt: string;
  updatedAt: string;
}

export interface VisitDto extends VisitListItemDto {
  attachments: PendingAttachmentDto[];
}

export type CompletedServiceOrderDto = ServiceOrderDto & { status: 'completed' };
export type NewInspectionServiceOrderDto = ServiceOrderDto & {
  type: 'inspection';
  source: Extract<ServiceOrderSource, 'system'>;
  status: 'new';
};

export interface VisitAttachmentUploadDto {
  clientFileId: string;
  attachment: PendingAttachmentDto;
  upload: AttachmentUploadFormDto;
}

export interface CreateVisitResultDto {
  visit: VisitDto;
  completedServiceOrder: CompletedServiceOrderDto | null;
  nextInspectionServiceOrder: NewInspectionServiceOrderDto | null;
  attachmentUploads: VisitAttachmentUploadDto[];
}

export type CreateVisitResponseDto = ApiSuccessResponse<CreateVisitResultDto>;
