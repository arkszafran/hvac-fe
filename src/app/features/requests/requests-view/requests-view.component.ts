import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

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
    TranslocoPipe,
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
  private readonly transloco = inject(TranslocoService);
  private readonly activeLanguage = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  protected readonly searchQuery = signal('');
  protected readonly statusFilter = signal<RequestStatusFilter>('new');
  protected readonly selectedRequestId = signal<string | null>(null);
  protected readonly scheduledRequestId = signal<string | null>(null);
  protected readonly requests = this.requestsStore.requests;
  protected readonly statusFilterOptions = computed<UiSelectOption[]>(() => {
    this.activeLanguage();

    return [
      {
        value: 'all',
        label: this.transloco.translate('requests.statuses.all'),
      },
      {
        value: 'new',
        label: getServiceRequestStatusLabel('new', this.transloco),
      },
      {
        value: 'scheduled',
        label: getServiceRequestStatusLabel('scheduled', this.transloco),
      },
      {
        value: 'completed',
        label: getServiceRequestStatusLabel('completed', this.transloco),
      },
      {
        value: 'cancelled',
        label: getServiceRequestStatusLabel('cancelled', this.transloco),
      },
    ];
  });

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

  protected statusCountLabel(status: ServiceRequestStatus): string {
    this.activeLanguage();

    return this.transloco.translate('requests.badges.statusCount', {
      label: getServiceRequestStatusLabel(status, this.transloco),
      count: this.statusCount(status),
    });
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
      getServiceRequestTypeLabel(request.requestType, this.transloco),
      getServiceRequestStatusLabel(request.status, this.transloco),
      formatServiceRequestCustomerName(request.customer, this.transloco),
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
