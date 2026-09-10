import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClientService, ApiRequestOptions } from '../api-client.service';
import {
  ServiceOrderDetailsQueryDto,
  ServiceOrderDetailsResponseDto,
  ServiceOrdersListQueryDto,
  ServiceOrdersListResponseDto,
} from './service-orders.model';

@Injectable({ providedIn: 'root' })
export class ServiceOrdersApi {
  private readonly api = inject(ApiClientService);

  listServiceOrders(
    query: ServiceOrdersListQueryDto = {},
    options?: ApiRequestOptions,
  ): Observable<ServiceOrdersListResponseDto> {
    return this.api.get<ServiceOrdersListResponseDto>('/service-orders', {
      ...options,
      params: {
        customerId: query.customerId,
        type: query.type,
        statuses: query.statuses,
        active: query.active,
        excludeDeviceId: query.excludeDeviceId,
        q: query.q,
        page: query.page,
        pageSize: query.pageSize,
        sortBy: query.sortBy,
        sortDirection: query.sortDirection,
      },
    });
  }

  getServiceOrderDetails(
    serviceOrderId: string,
    query: ServiceOrderDetailsQueryDto = {},
    options?: ApiRequestOptions,
  ): Observable<ServiceOrderDetailsResponseDto> {
    return this.api.get<ServiceOrderDetailsResponseDto>(
      `/service-orders/${encodeURIComponent(serviceOrderId)}`,
      {
        ...options,
        params: { ommitAttachments: query.ommitAttachments },
      },
    );
  }
}
