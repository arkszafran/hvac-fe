import {
  CreateVisitCustomerDto,
  CreateVisitDeviceDataDto,
  CustomerDetailsDto,
  CustomerDto,
  CustomerDeviceListItemDto,
  DeviceType as ApiDeviceType,
  ServiceOrderCustomerDto,
  ServiceOrderDeviceDto,
} from '../../../common/api';
import { Customer, CustomerDraft } from '../../customers/models/customer.model';
import { Device, DeviceDraft, DeviceType } from '../../customers/models/device.model';

export function toVisitCustomer(details: CustomerDetailsDto): Customer {
  return toCustomerModel(details.customer, details.devices.map(toCustomerDeviceModel));
}

export function toServiceOrderCustomerModel(
  customer: ServiceOrderCustomerDto,
  devices: readonly Device[] = [],
): Customer {
  return {
    id: customer.customerId ?? '',
    type: customer.type,
    companyName: customer.companyName,
    fullName: customer.fullName,
    phone: customer.phone,
    email: customer.email,
    address: customer.address,
    postalCode: customer.postalCode,
    city: customer.city,
    devices: [...devices],
  };
}

export function toServiceOrderDeviceModel(device: ServiceOrderDeviceDto): Device {
  return {
    id: device.deviceId ?? device.id,
    type: fromApiDeviceType(device.type),
    brand: device.brand,
    model: device.model,
    powerKw: null,
    serialNumber: device.serialNumber,
    installationDate: '',
    warrantyMonths: 0,
    warrantyUntil: '',
    note: '',
    refrigerant: device.refrigerant,
    refrigerantAmount: device.refrigerantAmount,
    location: device.location,
    hasCustomInstallationAddress: device.hasCustomInstallationAddress,
    address: device.address,
    postalCode: device.postalCode,
    city: device.city,
    visits: [],
  };
}

export function toCreateVisitCustomerDto(draft: CustomerDraft): CreateVisitCustomerDto {
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

export function toCreateVisitDeviceDto(draft: DeviceDraft): CreateVisitDeviceDataDto {
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

function toCustomerModel(customer: CustomerDto, devices: Device[]): Customer {
  return {
    id: customer.id,
    type: customer.type,
    companyName: customer.companyName,
    fullName: customer.fullName,
    phone: customer.phone,
    email: customer.email,
    address: customer.address,
    postalCode: customer.postalCode,
    city: customer.city,
    devices,
  };
}

function toCustomerDeviceModel(device: CustomerDeviceListItemDto): Device {
  return {
    id: device.id,
    type: fromApiDeviceType(device.type),
    brand: device.brand,
    model: device.model,
    powerKw: null,
    serialNumber: device.serialNumber,
    installationDate: device.installationDate,
    warrantyMonths: 0,
    warrantyUntil: '',
    note: '',
    refrigerant: '',
    refrigerantAmount: '',
    location: device.location,
    hasCustomInstallationAddress: device.hasCustomInstallationAddress,
    address: device.address,
    postalCode: device.postalCode,
    city: device.city,
    visits: [],
  };
}

function fromApiDeviceType(type: ApiDeviceType): Exclude<DeviceType, ''> {
  switch (type) {
    case 'air_conditioning':
      return 'air-conditioning';
    case 'heat_pump':
      return 'heat-pump';
    case 'ventilation':
      return 'ventilation';
  }
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
