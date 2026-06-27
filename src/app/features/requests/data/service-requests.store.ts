import { Injectable, signal } from '@angular/core';

import { ServiceRequest, ServiceRequestStatus } from '../models/service-request.model';
import { SERVICE_REQUEST_MOCKS } from './service-request.mock';

@Injectable({ providedIn: 'root' })
export class ServiceRequestsStore {
  private readonly requestsState = signal<ServiceRequest[]>(SERVICE_REQUEST_MOCKS);

  readonly requests = this.requestsState.asReadonly();

  getRequestById(requestId: string): ServiceRequest | undefined {
    return this.requestsState().find((request) => request.id === requestId);
  }

  confirmAppointment(requestId: string, appointmentDate: string): ServiceRequest | undefined {
    const normalizedDate = appointmentDate.trim();

    if (!normalizedDate) {
      return undefined;
    }

    return this.patchRequest(requestId, {
      status: 'scheduled',
      appointmentDate: normalizedDate,
    });
  }

  cancelRequest(requestId: string): ServiceRequest | undefined {
    return this.patchRequest(requestId, {
      status: 'cancelled',
    });
  }

  private patchRequest(
    requestId: string,
    patch: Partial<Pick<ServiceRequest, 'appointmentDate'> & { status: ServiceRequestStatus }>,
  ): ServiceRequest | undefined {
    let updatedRequest: ServiceRequest | undefined;
    const updatedAt = new Date().toISOString();

    this.requestsState.update((requests) =>
      requests.map((request) => {
        if (request.id !== requestId) {
          return request;
        }

        updatedRequest = {
          ...request,
          ...patch,
          updatedAt,
        } as ServiceRequest;

        return updatedRequest;
      }),
    );

    return updatedRequest;
  }
}
