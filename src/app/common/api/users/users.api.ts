import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClientService, ApiRequestOptions } from '../api-client.service';
import {
  ChangePasswordDto,
  ChangePinDto,
  CreateTenantDto,
  CreateTenantResponseDto,
  SetupNewUserCredentialsDto,
  UsersListResponseDto,
  UsersSuccessResponseDto,
} from './users.model';

@Injectable({ providedIn: 'root' })
export class UsersApi {
  private readonly api = inject(ApiClientService);

  getUsers(options?: ApiRequestOptions): Observable<UsersListResponseDto> {
    return this.api.get<UsersListResponseDto>('/users', options);
  }

  createTenant(
    body: CreateTenantDto,
    options?: ApiRequestOptions,
  ): Observable<CreateTenantResponseDto> {
    return this.api.post<CreateTenantResponseDto, CreateTenantDto>('/users/tenants', body, options);
  }

  setupInitialCredentials(
    body: SetupNewUserCredentialsDto,
    options?: ApiRequestOptions,
  ): Observable<UsersSuccessResponseDto> {
    return this.api.patch<UsersSuccessResponseDto, SetupNewUserCredentialsDto>(
      '/users/me/initial-credentials',
      body,
      options,
    );
  }

  changePassword(
    body: ChangePasswordDto,
    options?: ApiRequestOptions,
  ): Observable<UsersSuccessResponseDto> {
    return this.api.patch<UsersSuccessResponseDto, ChangePasswordDto>(
      '/users/me/password',
      body,
      options,
    );
  }

  changePin(body: ChangePinDto, options?: ApiRequestOptions): Observable<UsersSuccessResponseDto> {
    return this.api.patch<UsersSuccessResponseDto, ChangePinDto>('/users/me/pin', body, options);
  }
}
