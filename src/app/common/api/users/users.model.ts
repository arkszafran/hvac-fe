import { ApiSuccessResponse } from '../api-response.model';

export interface CreateTenantTenantDto {
  name: string;
  personName: string;
  street: string;
  city: string;
  zip: string;
  tax: string;
}

export interface CreateTenantUserDto {
  name: string;
  email: string;
}

export interface CreateTenantDto {
  tenant: CreateTenantTenantDto;
  user: CreateTenantUserDto;
}

export interface CreateTenantDataDto {
  tenantId: string;
  userId: string;
}

export type CreateTenantResponseDto = ApiSuccessResponse<CreateTenantDataDto>;

export interface SetupNewUserCredentialsDto {
  currentPassword: string;
  password: string;
  pin: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  password: string;
}

export interface ChangePinDto {
  currentPassword: string;
  pin: string;
}

export type UsersSuccessResponseDto = ApiSuccessResponse<Record<string, never> | null>;

export interface UserListItemDto {
  id: string;
  email: string;
  name: string;
}

export type UsersListResponseDto = ApiSuccessResponse<UserListItemDto[]>;
