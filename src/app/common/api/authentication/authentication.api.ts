import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClientService, ApiRequestOptions } from '../api-client.service';
import {
  AuthenticationRefreshResponseDto,
  AuthenticationSessionResponseDto,
  AuthenticationSuccessResponseDto,
  LoginDto,
  PinLoginDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
  UnlockAccountDto,
} from './authentication.model';

@Injectable({ providedIn: 'root' })
export class AuthenticationApi {
  private readonly api = inject(ApiClientService);

  session(options?: ApiRequestOptions): Observable<AuthenticationSessionResponseDto> {
    return this.api.get<AuthenticationSessionResponseDto>('/authentication/session', options);
  }

  login(body: LoginDto, options?: ApiRequestOptions): Observable<AuthenticationSuccessResponseDto> {
    return this.api.post<AuthenticationSuccessResponseDto, LoginDto>(
      '/authentication/login',
      body,
      options,
    );
  }

  refresh(options?: ApiRequestOptions): Observable<AuthenticationRefreshResponseDto> {
    return this.api.post<AuthenticationRefreshResponseDto>(
      '/authentication/refresh',
      undefined,
      options,
    );
  }

  logout(options?: ApiRequestOptions): Observable<AuthenticationSuccessResponseDto> {
    return this.api.post<AuthenticationSuccessResponseDto>(
      '/authentication/logout',
      undefined,
      options,
    );
  }

  pinLogin(
    body: PinLoginDto,
    options?: ApiRequestOptions,
  ): Observable<AuthenticationSuccessResponseDto> {
    return this.api.post<AuthenticationSuccessResponseDto, PinLoginDto>(
      '/authentication/pin-login',
      body,
      options,
    );
  }

  unlockAccount(
    body: UnlockAccountDto,
    options?: ApiRequestOptions,
  ): Observable<AuthenticationSuccessResponseDto> {
    return this.api.post<AuthenticationSuccessResponseDto, UnlockAccountDto>(
      '/authentication/account-unlock',
      body,
      options,
    );
  }

  requestPasswordReset(
    body: RequestPasswordResetDto,
    options?: ApiRequestOptions,
  ): Observable<AuthenticationSuccessResponseDto> {
    return this.api.post<AuthenticationSuccessResponseDto, RequestPasswordResetDto>(
      '/authentication/password-reset-request',
      body,
      options,
    );
  }

  resetPassword(
    body: ResetPasswordDto,
    options?: ApiRequestOptions,
  ): Observable<AuthenticationSuccessResponseDto> {
    return this.api.post<AuthenticationSuccessResponseDto, ResetPasswordDto>(
      '/authentication/password-reset',
      body,
      options,
    );
  }
}
