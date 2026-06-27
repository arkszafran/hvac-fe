import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import { UiBadgeComponent, UiButtonComponent, UiModalComponent } from '../../../../ui';
import { getDeviceTypeLabel } from '../../../customers/models/device.model';
import {
  InstallationServiceRequest,
  InspectionServiceRequest,
  RepairServiceRequest,
  ServiceRequest,
  ServiceRequestAttachment,
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
  imports: [NgTemplateOutlet, UiBadgeComponent, UiButtonComponent, UiModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-request-details-modal.component.html',
})
export class ServiceRequestDetailsModalComponent {
  readonly open = input(false);
  readonly request = input<ServiceRequest | null>(null);

  readonly close = output<void>();

  protected readonly selectedAttachment = signal<ServiceRequestAttachment | null>(null);

  protected readonly formatDate = formatDate;
  protected readonly formatOptional = formatOptionalValue;
  protected readonly formatAppointmentDate = formatServiceRequestAppointmentDate;
  protected readonly formatCustomerName = formatServiceRequestCustomerName;
  protected readonly formatCustomerAddress = formatServiceRequestCustomerAddress;
  protected readonly formatDeviceName = formatServiceRequestDeviceName;
  protected readonly getDeviceTypeLabel = getDeviceTypeLabel;
  protected readonly phoneHref = phoneHref;
  protected readonly getTypeLabel = getServiceRequestTypeLabel;
  protected readonly getStatusLabel = getServiceRequestStatusLabel;
  protected readonly getSourceLabel = getServiceRequestSourceLabel;
  protected readonly getCustomerTypeLabel = getServiceRequestCustomerTypeLabel;
  protected readonly getBuildingTypeLabel = getServiceRequestBuildingTypeLabel;
  protected readonly getOutdoorUnitPlaceLabel = getServiceRequestOutdoorUnitPlaceLabel;
  protected readonly getTypeBadgeVariant = getServiceRequestTypeBadgeVariant;
  protected readonly getStatusBadgeVariant = getServiceRequestStatusBadgeVariant;

  protected readonly modalTitle = computed(() => {
    const request = this.request();

    return request ? `Zgłoszenie: ${getServiceRequestTypeLabel(request.requestType)}` : 'Zgłoszenie';
  });

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
