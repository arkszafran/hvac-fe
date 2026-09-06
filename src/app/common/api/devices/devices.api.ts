import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClientService, ApiRequestOptions } from '../api-client.service';
import {
  CreateDeviceDto,
  CreateDeviceResponseDto,
  DeviceDetailsResponseDto,
  UpdateDeviceDto,
  UpdateDeviceResponseDto,
} from './devices.model';

@Injectable({ providedIn: 'root' })
export class DevicesApi {
  private readonly api = inject(ApiClientService);

  createDevice(
    body: CreateDeviceDto,
    options?: ApiRequestOptions,
  ): Observable<CreateDeviceResponseDto> {
    return this.api.post<CreateDeviceResponseDto, CreateDeviceDto>('/devices', body, options);
  }

  getDeviceDetails(
    deviceId: string,
    options?: ApiRequestOptions,
  ): Observable<DeviceDetailsResponseDto> {
    return this.api.get<DeviceDetailsResponseDto>(
      `/devices/${encodeURIComponent(deviceId)}`,
      options,
    );
  }

  updateDevice(
    deviceId: string,
    body: UpdateDeviceDto,
    options?: ApiRequestOptions,
  ): Observable<UpdateDeviceResponseDto> {
    return this.api.patch<UpdateDeviceResponseDto, UpdateDeviceDto>(
      `/devices/${encodeURIComponent(deviceId)}`,
      body,
      options,
    );
  }
}
