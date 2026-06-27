import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import {
  UiBadgeComponent,
  UiButtonComponent,
  UiTableCellTemplateDirective,
  UiTableColumn,
  UiTableComponent,
} from '../../../../ui';
import { ServiceRequest } from '../../models/service-request.model';
import {
  formatServiceRequestAppointmentDate,
  formatServiceRequestCustomerAddress,
  formatServiceRequestCustomerName,
  getServiceRequestStatusBadgeVariant,
  getServiceRequestStatusLabel,
  getServiceRequestTypeBadgeVariant,
  getServiceRequestTypeLabel,
  phoneHref,
} from '../../utils/service-request-ui.util';

@Component({
  selector: 'app-service-request-table',
  imports: [
    UiBadgeComponent,
    UiButtonComponent,
    UiTableCellTemplateDirective,
    UiTableComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-request-table.component.html',
})
export class ServiceRequestTableComponent {
  readonly requests = input<ServiceRequest[]>([]);
  readonly showStatusBadge = input(false);

  readonly requestSelected = output<ServiceRequest>();
  readonly appointmentConfirmationRequested = output<ServiceRequest>();
  readonly cancellationRequested = output<ServiceRequest>();
  readonly visitCreationRequested = output<ServiceRequest>();

  protected readonly phoneHref = phoneHref;
  protected readonly emailHref = emailHref;
  protected readonly formatAppointmentDate = formatServiceRequestAppointmentDate;
  protected readonly getTypeLabel = getServiceRequestTypeLabel;
  protected readonly getStatusLabel = getServiceRequestStatusLabel;
  protected readonly getTypeBadgeVariant = getServiceRequestTypeBadgeVariant;
  protected readonly getStatusBadgeVariant = getServiceRequestStatusBadgeVariant;

  protected readonly columns: UiTableColumn<ServiceRequest>[] = [
    {
      id: 'type',
      header: 'Typ zgłoszenia',
      width: '22%',
    },
    {
      id: 'customer',
      header: 'Klient i adres',
      cell: (request) => formatServiceRequestCustomerName(request.customer),
      description: (request) => formatServiceRequestCustomerAddress(request.customer),
      tone: 'primary',
      width: '31%',
    },
    {
      id: 'phone',
      header: 'Telefon',
      width: '24%',
    },
    {
      id: 'actions',
      header: 'Akcje',
      align: 'end',
      width: '23%',
    },
  ];

  protected handleConfirmAppointment(event: MouseEvent, request: ServiceRequest): void {
    event.stopPropagation();
    this.appointmentConfirmationRequested.emit(request);
  }

  protected handleCancel(event: MouseEvent, request: ServiceRequest): void {
    event.stopPropagation();
    this.cancellationRequested.emit(request);
  }

  protected handleCreateVisit(event: MouseEvent, request: ServiceRequest): void {
    event.stopPropagation();
    this.visitCreationRequested.emit(request);
  }
}

function emailHref(email: string): string {
  const normalizedEmail = email.trim();

  return normalizedEmail ? `mailto:${normalizedEmail}` : '#';
}
