import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClientService, ApiRequestOptions } from '../api-client.service';
import {
  CreateCustomerDto,
  CreateCustomerResponseDto,
  CustomerDetailsResponseDto,
  CustomersListQueryDto,
  CustomersListResponseDto,
  UpdateCustomerDto,
  UpdateCustomerResponseDto,
} from './customers.model';

@Injectable({ providedIn: 'root' })
export class CustomersApi {
  private readonly api = inject(ApiClientService);

  listCustomers(
    query: CustomersListQueryDto = {},
    options?: ApiRequestOptions,
  ): Observable<CustomersListResponseDto> {
    return this.api.get<CustomersListResponseDto>('/customers', {
      ...options,
      params: {
        q: query.q ?? '',
        page: query.page,
        sortBy: query.sortBy,
        sortDirection: query.sortDirection,
      },
    });
  }

  createCustomer(
    body: CreateCustomerDto,
    options?: ApiRequestOptions,
  ): Observable<CreateCustomerResponseDto> {
    return this.api.post<CreateCustomerResponseDto, CreateCustomerDto>('/customers', body, options);
  }

  getCustomerDetails(
    customerId: string,
    options?: ApiRequestOptions,
  ): Observable<CustomerDetailsResponseDto> {
    return this.api.get<CustomerDetailsResponseDto>(
      `/customers/${encodeURIComponent(customerId)}`,
      options,
    );
  }

  updateCustomer(
    customerId: string,
    body: UpdateCustomerDto,
    options?: ApiRequestOptions,
  ): Observable<UpdateCustomerResponseDto> {
    return this.api.patch<UpdateCustomerResponseDto, UpdateCustomerDto>(
      `/customers/${encodeURIComponent(customerId)}`,
      body,
      options,
    );
  }
}
