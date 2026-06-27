import { ApiSuccessResponse } from '../api-response.model';

export interface LoginDto {
  email: string;
  password: string;
}

export interface PinLoginDto {
  pin: string;
}

export interface UnlockAccountDto {
  userId: string;
  code: string;
}

export interface RequestPasswordResetDto {
  email: string;
}

export interface ResetPasswordDto {
  userId: string;
  code: string;
  password: string;
}

export interface AuthenticationRedirectErrorDetailsDto {
  redirectTo: string;
}

export type AuthenticationSessionTenantRole = 'USER' | 'ADMIN';
export type AuthenticationSessionUserRole = 'TENANT_USER' | 'ADMIN';
export type AuthenticationSessionUserStatus = 'active' | 'blocked' | 'new';

export interface AuthenticationSessionTenantDto {
  id: string;
  name: string;
  role: AuthenticationSessionTenantRole;
}

export interface AuthenticationSessionUserDto {
  id: string;
  name: string;
  email: string;
  role: AuthenticationSessionUserRole;
  status: AuthenticationSessionUserStatus;
  tenants: AuthenticationSessionTenantDto[];
}

export type AuthenticationSuccessResponseDto = ApiSuccessResponse<Record<string, never> | null>;
export type AuthenticationSessionResponseDto = ApiSuccessResponse<AuthenticationSessionUserDto>;
