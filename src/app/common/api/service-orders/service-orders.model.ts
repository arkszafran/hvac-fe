import { ApiSuccessResponse } from '../api-response.model';

export type ServiceOrderType = 'installation' | 'repair' | 'inspection';
export type ServiceOrderSource = 'customer_panel' | 'website_form' | 'user' | 'system';
export type ServiceOrderStatus =
  | 'new'
  | 'contact_required'
  | 'scheduled'
  | 'completed'
  | 'cancelled';

export interface ServiceOrderDto {
  id: string;
  customerId: string;
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

export interface ServiceOrdersListQueryDto {
  customerId: string;
  type: 'inspection';
  statuses?: string;
  active?: boolean;
  excludeDeviceId?: string;
}

export type ActiveInspectionServiceOrdersResponseDto = ApiSuccessResponse<
  InspectionServiceOrderDto[]
>;
