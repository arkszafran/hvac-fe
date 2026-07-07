import { TranslocoService } from '@jsverse/transloco';
import type { UiBadgeVariant } from '../../../ui';
import {
  ServiceRequest,
  ServiceRequestBuildingType,
  ServiceRequestCustomer,
  ServiceRequestCustomerType,
  ServiceRequestDevice,
  ServiceRequestOutdoorUnitPlace,
  ServiceRequestSource,
  ServiceRequestStatus,
  ServiceRequestType,
} from '../models/service-request.model';

const REQUEST_TYPE_LABEL_KEYS: Record<ServiceRequestType, string> = {
  installation: 'requests.types.installation',
  repair: 'requests.types.repair',
  inspection: 'requests.types.inspection',
};

const REQUEST_STATUS_LABEL_KEYS: Record<ServiceRequestStatus, string> = {
  new: 'requests.statuses.new',
  scheduled: 'requests.statuses.scheduled',
  completed: 'requests.statuses.completed',
  cancelled: 'requests.statuses.cancelled',
};

const REQUEST_SOURCE_LABEL_KEYS: Record<ServiceRequestSource, string> = {
  'customer-panel': 'requests.sources.customerPanel',
  'website-form': 'requests.sources.websiteForm',
};

const CUSTOMER_TYPE_LABEL_KEYS: Record<ServiceRequestCustomerType, string> = {
  company: 'requests.customerTypes.company',
  individual: 'requests.customerTypes.individual',
};

const BUILDING_TYPE_LABEL_KEYS: Record<ServiceRequestBuildingType, string> = {
  'apartment-block': 'requests.buildingTypes.apartmentBlock',
  house: 'requests.buildingTypes.house',
  'office-building': 'requests.buildingTypes.officeBuilding',
};

const OUTDOOR_UNIT_PLACE_LABEL_KEYS: Record<ServiceRequestOutdoorUnitPlace, string> = {
  wall: 'requests.outdoorUnitPlaces.wall',
  balcony: 'requests.outdoorUnitPlaces.balcony',
};

const REQUEST_TYPE_BADGE_VARIANTS: Record<ServiceRequestType, UiBadgeVariant> = {
  installation: 'info',
  repair: 'warning',
  inspection: 'success',
};

const REQUEST_STATUS_BADGE_VARIANTS: Record<ServiceRequestStatus, UiBadgeVariant> = {
  new: 'info',
  scheduled: 'warning',
  completed: 'success',
  cancelled: 'danger',
};

export function getServiceRequestTypeLabel(
  type: ServiceRequestType,
  transloco: TranslocoService,
): string {
  return transloco.translate(REQUEST_TYPE_LABEL_KEYS[type]);
}

export function getServiceRequestStatusLabel(
  status: ServiceRequestStatus,
  transloco: TranslocoService,
): string {
  return transloco.translate(REQUEST_STATUS_LABEL_KEYS[status]);
}

export function getServiceRequestSourceLabel(
  source: ServiceRequestSource,
  transloco: TranslocoService,
): string {
  return transloco.translate(REQUEST_SOURCE_LABEL_KEYS[source]);
}

export function getServiceRequestCustomerTypeLabel(
  type: ServiceRequestCustomerType,
  transloco: TranslocoService,
): string {
  return transloco.translate(CUSTOMER_TYPE_LABEL_KEYS[type]);
}

export function getServiceRequestBuildingTypeLabel(
  type: ServiceRequestBuildingType,
  transloco: TranslocoService,
): string {
  return transloco.translate(BUILDING_TYPE_LABEL_KEYS[type]);
}

export function getServiceRequestOutdoorUnitPlaceLabel(
  place: ServiceRequestOutdoorUnitPlace,
  transloco: TranslocoService,
): string {
  return transloco.translate(OUTDOOR_UNIT_PLACE_LABEL_KEYS[place]);
}

export function getServiceRequestTypeBadgeVariant(type: ServiceRequestType): UiBadgeVariant {
  return REQUEST_TYPE_BADGE_VARIANTS[type];
}

export function getServiceRequestStatusBadgeVariant(status: ServiceRequestStatus): UiBadgeVariant {
  return REQUEST_STATUS_BADGE_VARIANTS[status];
}

export function formatServiceRequestCustomerName(
  customer: ServiceRequestCustomer,
  transloco: TranslocoService,
): string {
  return customer.companyName || customer.fullName || transloco.translate('customers.fallbackName');
}

export function formatServiceRequestCustomerAddress(customer: ServiceRequestCustomer): string {
  const cityLine = [customer.postalCode, customer.city].filter(Boolean).join(' ');

  return [customer.address, cityLine].filter(Boolean).join(', ') || '--';
}

export function formatServiceRequestAppointmentDate(
  request: ServiceRequest,
  transloco?: TranslocoService,
): string {
  if (!request.appointmentDate) {
    return '--';
  }

  return formatDate(request.appointmentDate, transloco);
}

export function formatDate(value: string, transloco?: TranslocoService): string {
  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    return value || '--';
  }

  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) {
    return value || '--';
  }

  const locale = transloco?.getActiveLang() === 'en' ? 'en-US' : 'pl-PL';

  return new Intl.DateTimeFormat(locale).format(date);
}

export function formatOptionalValue(value: string | number | null | undefined, suffix = ''): string {
  if (value === null || value === undefined || value === '') {
    return '--';
  }

  return `${value}${suffix}`;
}

export function formatServiceRequestDeviceName(
  device: ServiceRequestDevice,
  transloco: TranslocoService,
): string {
  return [device.brand, device.model].filter(Boolean).join(' ') || transloco.translate('devices.table.device');
}

export function phoneHref(phone: string): string {
  const normalizedPhone = phone.replace(/[^\d+]/g, '');

  return normalizedPhone ? `tel:${normalizedPhone}` : '#';
}

export function normalizeSearchValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
