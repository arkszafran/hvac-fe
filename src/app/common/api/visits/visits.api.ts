import { HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClientService, ApiRequestOptions } from '../api-client.service';
import {
  CreateVisitDto,
  CreateVisitResponseDto,
  VisitsListQueryDto,
  VisitsListResponseDto,
} from './visits.model';

@Injectable({ providedIn: 'root' })
export class VisitsApi {
  private readonly api = inject(ApiClientService);

  listVisits(
    query: VisitsListQueryDto = {},
    options?: ApiRequestOptions,
  ): Observable<VisitsListResponseDto> {
    return this.api.get<VisitsListResponseDto>('/visits', {
      ...options,
      params: {
        q: query.q,
        page: query.page,
        pageSize: query.pageSize,
        sortBy: query.sortBy,
        sortDirection: query.sortDirection,
      },
    });
  }

  createVisit(
    body: CreateVisitDto,
    idempotencyKey: string,
    options?: ApiRequestOptions,
  ): Observable<CreateVisitResponseDto> {
    return this.api.post<CreateVisitResponseDto, CreateVisitDto>('/visits', body, {
      ...options,
      headers: addIdempotencyKey(options?.headers, idempotencyKey),
    });
  }
}

function addIdempotencyKey(
  headers: ApiRequestOptions['headers'],
  idempotencyKey: string,
): HttpHeaders | Record<string, string | string[]> {
  if (headers instanceof HttpHeaders) {
    return headers.set('Idempotency-Key', idempotencyKey);
  }

  return {
    ...headers,
    'Idempotency-Key': idempotencyKey,
  };
}
