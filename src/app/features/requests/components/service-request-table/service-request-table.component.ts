import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

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
    TranslocoPipe,
    UiTableCellTemplateDirective,
    UiTableComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-request-table.component.html',
})
export class ServiceRequestTableComponent {
  private readonly transloco = inject(TranslocoService);
  private readonly activeLanguage = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  readonly requests = input<ServiceRequest[]>([]);
  readonly showStatusBadge = input(false);

  readonly requestSelected = output<ServiceRequest>();
  readonly appointmentConfirmationRequested = output<ServiceRequest>();
  readonly cancellationRequested = output<ServiceRequest>();
  readonly visitCreationRequested = output<ServiceRequest>();

  protected readonly phoneHref = phoneHref;
  protected readonly emailHref = emailHref;
  protected readonly getTypeBadgeVariant = getServiceRequestTypeBadgeVariant;
  protected readonly getStatusBadgeVariant = getServiceRequestStatusBadgeVariant;

  protected readonly columns = computed<UiTableColumn<ServiceRequest>[]>(() => {
    this.activeLanguage();

    return [
      {
        id: 'type',
        header: this.transloco.translate('requests.fields.requestType'),
        width: '22%',
      },
      {
        id: 'customer',
        header: this.transloco.translate('requests.fields.customerAndAddress'),
        cell: (request) => formatServiceRequestCustomerName(request.customer, this.transloco),
        description: (request) => formatServiceRequestCustomerAddress(request.customer),
        tone: 'primary',
        width: '31%',
      },
      {
        id: 'phone',
        header: this.transloco.translate('customers.form.phone'),
        width: '24%',
      },
      {
        id: 'actions',
        header: this.transloco.translate('devices.table.actions'),
        align: 'end',
        width: '23%',
      },
    ];
  });

  protected formatAppointmentDate(request: ServiceRequest): string {
    return formatServiceRequestAppointmentDate(request, this.transloco);
  }

  protected getTypeLabel(type: ServiceRequest['requestType']): string {
    return getServiceRequestTypeLabel(type, this.transloco);
  }

  protected getStatusLabel(status: ServiceRequest['status']): string {
    return getServiceRequestStatusLabel(status, this.transloco);
  }

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
