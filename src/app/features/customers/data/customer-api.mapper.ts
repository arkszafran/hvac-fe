import {
  CreateCustomerDto,
  CreateDeviceDto,
  CreateDeviceServiceOrderCommandDto,
  DeviceDto,
  DeviceType as ApiDeviceType,
  InspectionServiceOrderDto,
  UpdateCustomerDto,
  UpdateDeviceDto,
  UpdateDeviceServiceOrderCommandDto,
} from '../../../common/api';
import { CustomerDraft } from '../models/customer.model';
import { DeviceDraft, DeviceType } from '../models/device.model';

export function toCreateCustomerDto(draft: CustomerDraft): CreateCustomerDto {
  return normalizeCustomerDraft(draft);
}

export function toUpdateCustomerDto(draft: CustomerDraft): UpdateCustomerDto {
  return normalizeCustomerDraft(draft);
}

export function toCreateDeviceDto(
  customerId: string,
  draft: DeviceDraft,
  serviceOrder?: CreateDeviceServiceOrderCommandDto,
): CreateDeviceDto {
  return {
    ...toDeviceFields(draft),
    customerId,
    serviceOrder,
  };
}

export function toUpdateDeviceDto(
  draft: DeviceDraft,
  serviceOrder?: UpdateDeviceServiceOrderCommandDto,
): UpdateDeviceDto {
  return {
    ...toDeviceFields(draft),
    serviceOrder,
  };
}

export function toDeviceDraft(
  device: DeviceDto,
  activeInspection: InspectionServiceOrderDto | null,
): DeviceDraft {
  return {
    type: fromApiDeviceType(device.type),
    brand: device.brand,
    model: device.model,
    powerKw: device.powerKw,
    serialNumber: device.serialNumber,
    installationDate: device.installationDate,
    warrantyMonths: device.warrantyMonths,
    hasScheduledInspections: activeInspection !== null,
    nextInspectionDate: activeInspection?.scheduledAt ?? '',
    note: device.note,
    refrigerant: device.refrigerant,
    refrigerantAmount: device.refrigerantAmount,
    location: device.location,
    hasCustomInstallationAddress: device.hasCustomInstallationAddress,
    address: device.address,
    postalCode: device.postalCode,
    city: device.city,
  };
}

export function fromApiDeviceType(type: ApiDeviceType): Exclude<DeviceType, ''> {
  switch (type) {
    case 'air_conditioning':
      return 'air-conditioning';
    case 'heat_pump':
      return 'heat-pump';
    case 'ventilation':
      return 'ventilation';
  }
}

function normalizeCustomerDraft(draft: CustomerDraft): CreateCustomerDto {
  return {
    type: draft.type,
    companyName: draft.type === 'company' ? draft.companyName.trim() : '',
    fullName: draft.fullName.trim(),
    phone: draft.phone.trim(),
    email: draft.email.trim(),
    address: draft.address.trim(),
    postalCode: draft.postalCode.trim(),
    city: draft.city.trim(),
  };
}

function toDeviceFields(draft: DeviceDraft): Omit<CreateDeviceDto, 'customerId' | 'serviceOrder'> {
  return {
    type: toApiDeviceType(draft.type),
    brand: draft.brand.trim(),
    model: draft.model.trim(),
    powerKw: draft.powerKw,
    serialNumber: draft.serialNumber.trim(),
    installationDate: draft.installationDate.trim(),
    warrantyMonths: Math.max(0, draft.warrantyMonths),
    note: draft.note.trim(),
    refrigerant: draft.refrigerant.trim(),
    refrigerantAmount: draft.refrigerantAmount.trim(),
    location: draft.location.trim(),
    hasCustomInstallationAddress: draft.hasCustomInstallationAddress,
    address: draft.hasCustomInstallationAddress ? draft.address.trim() : '',
    postalCode: draft.hasCustomInstallationAddress ? draft.postalCode.trim() : '',
    city: draft.hasCustomInstallationAddress ? draft.city.trim() : '',
  };
}

function toApiDeviceType(type: DeviceType): ApiDeviceType {
  switch (type) {
    case 'air-conditioning':
      return 'air_conditioning';
    case 'heat-pump':
      return 'heat_pump';
    case 'ventilation':
      return 'ventilation';
    default:
      throw new Error('Device type is required.');
  }
}
