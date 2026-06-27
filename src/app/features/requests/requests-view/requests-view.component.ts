import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  UiBadgeComponent,
  UiCardComponent,
  UiInputComponent,
  UiSelectComponent,
  UiSelectOption,
} from '../../../ui';
import { ServiceRequestDetailsModalComponent } from '../components/service-request-details-modal/service-request-details-modal.component';
import { ServiceRequestScheduleModalComponent } from '../components/service-request-schedule-modal/service-request-schedule-modal.component';
import { ServiceRequestTableComponent } from '../components/service-request-table/service-request-table.component';
import { ServiceRequestsStore } from '../data/service-requests.store';
import { ServiceRequest, ServiceRequestStatus } from '../models/service-request.model';
import {
  formatServiceRequestCustomerAddress,
  formatServiceRequestCustomerName,
  getServiceRequestStatusLabel,
  getServiceRequestTypeLabel,
  normalizeSearchValue,
} from '../utils/service-request-ui.util';

type RequestStatusFilter = 'all' | ServiceRequestStatus;

@Component({
  selector: 'app-requests-view',
  imports: [
    FormsModule,
    UiBadgeComponent,
    UiCardComponent,
    UiInputComponent,
    UiSelectComponent,
    ServiceRequestDetailsModalComponent,
    ServiceRequestScheduleModalComponent,
    ServiceRequestTableComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './requests-view.component.html',
})
export class RequestsViewComponent {
  private readonly router = inject(Router);
  private readonly requestsStore = inject(ServiceRequestsStore);

  protected readonly searchQuery = signal('');
  protected readonly statusFilter = signal<RequestStatusFilter>('new');
  protected readonly selectedRequestId = signal<string | null>(null);
  protected readonly scheduledRequestId = signal<string | null>(null);
  protected readonly requests = this.requestsStore.requests;
  protected readonly statusFilterOptions: UiSelectOption[] = [
    {
      value: 'all',
      label: 'Wszystkie',
    },
    {
      value: 'new',
      label: 'Do kontaktu',
    },
    {
      value: 'scheduled',
      label: 'Umówione',
    },
    {
      value: 'completed',
      label: 'Zakończone',
    },
    {
      value: 'cancelled',
      label: 'Anulowane',
    },
  ];

  protected readonly filteredRequests = computed(() => {
    const statusFilter = this.statusFilter();

    return this.requests().filter((request) => {
      if (statusFilter !== 'all' && request.status !== statusFilter) {
        return false;
      }

      return this.matchesSearchQuery(request);
    });
  });

  protected readonly selectedRequest = computed(() => {
    const requestId = this.selectedRequestId();

    return requestId ? this.requestsStore.getRequestById(requestId) ?? null : null;
  });

  protected readonly scheduledRequest = computed(() => {
    const requestId = this.scheduledRequestId();

    return requestId ? this.requestsStore.getRequestById(requestId) ?? null : null;
  });

  protected openDetails(request: ServiceRequest): void {
    this.selectedRequestId.set(request.id);
  }

  protected openScheduleModal(request: ServiceRequest): void {
    this.scheduledRequestId.set(request.id);
  }

  protected confirmAppointment(appointmentDate: string): void {
    const requestId = this.scheduledRequestId();

    if (!requestId) {
      return;
    }

    this.requestsStore.confirmAppointment(requestId, appointmentDate);
    this.scheduledRequestId.set(null);
  }

  protected cancelRequest(request: ServiceRequest): void {
    this.requestsStore.cancelRequest(request.id);
  }

  protected createVisit(request: ServiceRequest): void {
    void this.router.navigate(['/visits/new'], {
      queryParams: {
        requestId: request.id,
      },
    });
  }

  protected statusCount(status: ServiceRequestStatus): number {
    return this.requests().filter((request) => request.status === status).length;
  }

  protected setStatusFilter(value: string): void {
    this.statusFilter.set(parseStatusFilter(value));
  }

  private matchesSearchQuery(request: ServiceRequest): boolean {
    const query = normalizeSearchValue(this.searchQuery());

    if (!query) {
      return true;
    }

    return normalizeSearchValue(this.searchText(request)).includes(query);
  }

  private searchText(request: ServiceRequest): string {
    return [
      getServiceRequestTypeLabel(request.requestType),
      getServiceRequestStatusLabel(request.status),
      formatServiceRequestCustomerName(request.customer),
      request.customer.fullName,
      request.customer.companyName,
      request.customer.phone,
      request.customer.email,
      formatServiceRequestCustomerAddress(request.customer),
      request.note,
      this.deviceSearchText(request),
    ].join(' ');
  }

  private deviceSearchText(request: ServiceRequest): string {
    if (request.requestType === 'installation') {
      return '';
    }

    const devices =
      request.requestType === 'repair' ? request.repair.devices : request.inspection.devices;

    return devices
      .map((device) =>
        [
          device.brand,
          device.model,
          device.serialNumber,
          device.refrigerant,
          device.refrigerantAmount,
          device.displayedError,
        ].join(' '),
      )
      .join(' ');
  }
}

function parseStatusFilter(value: string): RequestStatusFilter {
  switch (value) {
    case 'new':
    case 'scheduled':
    case 'completed':
    case 'cancelled':
      return value;
    default:
      return 'all';
  }
}
