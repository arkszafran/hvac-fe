import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClientService, ApiRequestOptions } from '../api-client.service';
import {
  ActiveInspectionServiceOrdersResponseDto,
  ServiceOrdersListQueryDto,
} from './service-orders.model';

@Injectable({ providedIn: 'root' })
export class ServiceOrdersApi {
  private readonly api = inject(ApiClientService);

  listServiceOrders(
    query: ServiceOrdersListQueryDto,
    options?: ApiRequestOptions,
  ): Observable<ActiveInspectionServiceOrdersResponseDto> {
    return this.api.get<ActiveInspectionServiceOrdersResponseDto>('/service-orders', {
      ...options,
      params: {
        customerId: query.customerId,
        type: query.type,
        statuses: query.statuses,
        active: query.active,
        excludeDeviceId: query.excludeDeviceId,
      },
    });
  }
}
