import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { UiBadgeComponent, UiButtonComponent, UiModalComponent } from '../../../../ui';
import { DeviceType, getDeviceTypeLabel as readDeviceTypeLabel } from '../../../customers/models/device.model';
import {
  InstallationServiceRequest,
  InspectionServiceRequest,
  RepairServiceRequest,
  ServiceRequest,
  ServiceRequestAttachment,
  ServiceRequestBuildingType,
  ServiceRequestCustomerType,
  ServiceRequestDevice,
  ServiceRequestOutdoorUnitPlace,
  ServiceRequestSource,
  ServiceRequestStatus,
  ServiceRequestType,
} from '../../models/service-request.model';
import {
  formatDate,
  formatOptionalValue,
  formatServiceRequestAppointmentDate,
  formatServiceRequestCustomerAddress,
  formatServiceRequestCustomerName,
  formatServiceRequestDeviceName,
  getServiceRequestBuildingTypeLabel,
  getServiceRequestCustomerTypeLabel,
  getServiceRequestOutdoorUnitPlaceLabel,
  getServiceRequestSourceLabel,
  getServiceRequestStatusBadgeVariant,
  getServiceRequestStatusLabel,
  getServiceRequestTypeBadgeVariant,
  getServiceRequestTypeLabel,
  phoneHref,
} from '../../utils/service-request-ui.util';

@Component({
  selector: 'app-service-request-details-modal',
  imports: [NgTemplateOutlet, TranslocoPipe, UiBadgeComponent, UiButtonComponent, UiModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-request-details-modal.component.html',
})
export class ServiceRequestDetailsModalComponent {
  private readonly transloco = inject(TranslocoService);

  readonly open = input(false);
  readonly request = input<ServiceRequest | null>(null);

  readonly close = output<void>();

  protected readonly selectedAttachment = signal<ServiceRequestAttachment | null>(null);

  protected readonly formatOptional = formatOptionalValue;
  protected readonly formatCustomerAddress = formatServiceRequestCustomerAddress;
  protected readonly phoneHref = phoneHref;
  protected readonly getTypeBadgeVariant = getServiceRequestTypeBadgeVariant;
  protected readonly getStatusBadgeVariant = getServiceRequestStatusBadgeVariant;

  protected readonly modalTitle = computed(() => {
    const request = this.request();

    return request
      ? this.transloco.translate('requests.details.title', {
          type: getServiceRequestTypeLabel(request.requestType, this.transloco),
        })
      : this.transloco.translate('requests.details.fallbackTitle');
  });

  protected formatDate(value: string): string {
    return formatDate(value, this.transloco);
  }

  protected formatAppointmentDate(request: ServiceRequest): string {
    return formatServiceRequestAppointmentDate(request, this.transloco);
  }

  protected formatCustomerName(customer: ServiceRequest['customer']): string {
    return formatServiceRequestCustomerName(customer, this.transloco);
  }

  protected formatDeviceName(device: ServiceRequestDevice): string {
    return formatServiceRequestDeviceName(device, this.transloco);
  }

  protected getTypeLabel(type: ServiceRequestType): string {
    return getServiceRequestTypeLabel(type, this.transloco);
  }

  protected getStatusLabel(status: ServiceRequestStatus): string {
    return getServiceRequestStatusLabel(status, this.transloco);
  }

  protected getSourceLabel(source: ServiceRequestSource): string {
    return getServiceRequestSourceLabel(source, this.transloco);
  }

  protected getCustomerTypeLabel(type: ServiceRequestCustomerType): string {
    return getServiceRequestCustomerTypeLabel(type, this.transloco);
  }

  protected getBuildingTypeLabel(type: ServiceRequestBuildingType): string {
    return getServiceRequestBuildingTypeLabel(type, this.transloco);
  }

  protected getOutdoorUnitPlaceLabel(place: ServiceRequestOutdoorUnitPlace): string {
    return getServiceRequestOutdoorUnitPlaceLabel(place, this.transloco);
  }

  protected getDeviceTypeLabel(type: DeviceType): string {
    return readDeviceTypeLabel(type, this.transloco);
  }

  protected attachmentAlt(attachment: ServiceRequestAttachment): string {
    return attachment.description || attachment.fileName;
  }

  protected openAttachmentPreview(attachment: ServiceRequestAttachment): void {
    this.selectedAttachment.set(attachment);
  }

  protected closeAttachmentPreview(): void {
    this.selectedAttachment.set(null);
  }

  protected handleClose(): void {
    this.closeAttachmentPreview();
    this.close.emit();
  }

  protected asInstallation(request: ServiceRequest): InstallationServiceRequest | null {
    return request.requestType === 'installation' ? request : null;
  }

  protected asRepair(request: ServiceRequest): RepairServiceRequest | null {
    return request.requestType === 'repair' ? request : null;
  }

  protected asInspection(request: ServiceRequest): InspectionServiceRequest | null {
    return request.requestType === 'inspection' ? request : null;
  }
}
