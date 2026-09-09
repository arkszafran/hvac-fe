import { ApiSuccessResponse } from '../api-response.model';
import { DeviceType } from '../devices/devices.model';
import { InspectionServiceOrderDto, ServiceOrderDto } from '../service-orders/service-orders.model';

export type CustomerType = 'company' | 'individual';
export type CustomerSortBy = 'displayName' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

export interface CustomersListQueryDto {
  q?: string;
  page?: number;
  sortBy?: CustomerSortBy;
  sortDirection?: SortDirection;
}

export interface CustomerDto {
  id: string;
  type: CustomerType;
  companyName: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  postalCode: string;
  city: string;
  createdAt: string;
  updatedAt: string;
}

export type CustomerListItemDto = CustomerDto;

export interface ClientFilteredCustomersDto {
  filteringMode: 'client';
  items: CustomerListItemDto[];
  totalItems: number;
}

export interface PaginationResponseDto {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface ServerFilteredCustomersDto {
  filteringMode: 'server';
  items: CustomerListItemDto[];
  pagination: PaginationResponseDto;
}

export type CustomersListDataDto = ClientFilteredCustomersDto | ServerFilteredCustomersDto;
export type CustomersListResponseDto = ApiSuccessResponse<CustomersListDataDto>;

export interface CreateCustomerDto {
  type: CustomerType;
  companyName: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  postalCode: string;
  city: string;
}

export type UpdateCustomerDto = Partial<CreateCustomerDto>;
export type CreateCustomerResponseDto = ApiSuccessResponse<CustomerDto>;
export type UpdateCustomerResponseDto = ApiSuccessResponse<CustomerDto>;

export interface CustomerDeviceListItemDto {
  id: string;
  customerId: string;
  type: DeviceType;
  brand: string;
  model: string;
  serialNumber: string;
  installationDate: string;
  location: string;
  hasCustomInstallationAddress: boolean;
  address: string;
  postalCode: string;
  city: string;
  activeInspection: InspectionServiceOrderDto | null;
}

export type CustomerServiceOrderDto = ServiceOrderDto;

export interface CustomerDetailsDto {
  customer: CustomerDto;
  devices: CustomerDeviceListItemDto[];
  serviceOrders: CustomerServiceOrderDto[];
}

export type CustomerDetailsResponseDto = ApiSuccessResponse<CustomerDetailsDto>;
