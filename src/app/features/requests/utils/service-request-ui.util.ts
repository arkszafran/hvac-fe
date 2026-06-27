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

const REQUEST_TYPE_LABELS: Record<ServiceRequestType, string> = {
  installation: 'Montaż',
  repair: 'Naprawa',
  inspection: 'Przegląd',
};

const REQUEST_STATUS_LABELS: Record<ServiceRequestStatus, string> = {
  new: 'Do kontaktu',
  scheduled: 'Umówione',
  completed: 'Zakończone',
  cancelled: 'Anulowane',
};

const REQUEST_SOURCE_LABELS: Record<ServiceRequestSource, string> = {
  'customer-panel': 'Panel klienta',
  'website-form': 'Formularz na stronie',
};

const CUSTOMER_TYPE_LABELS: Record<ServiceRequestCustomerType, string> = {
  company: 'Firma',
  individual: 'Osoba prywatna',
};

const BUILDING_TYPE_LABELS: Record<ServiceRequestBuildingType, string> = {
  'apartment-block': 'Blok',
  house: 'Dom',
  'office-building': 'Biurowiec',
};

const OUTDOOR_UNIT_PLACE_LABELS: Record<ServiceRequestOutdoorUnitPlace, string> = {
  wall: 'Ściana',
  balcony: 'Balkon',
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

export function getServiceRequestTypeLabel(type: ServiceRequestType): string {
  return REQUEST_TYPE_LABELS[type];
}

export function getServiceRequestStatusLabel(status: ServiceRequestStatus): string {
  return REQUEST_STATUS_LABELS[status];
}

export function getServiceRequestSourceLabel(source: ServiceRequestSource): string {
  return REQUEST_SOURCE_LABELS[source];
}

export function getServiceRequestCustomerTypeLabel(type: ServiceRequestCustomerType): string {
  return CUSTOMER_TYPE_LABELS[type];
}

export function getServiceRequestBuildingTypeLabel(type: ServiceRequestBuildingType): string {
  return BUILDING_TYPE_LABELS[type];
}

export function getServiceRequestOutdoorUnitPlaceLabel(
  place: ServiceRequestOutdoorUnitPlace,
): string {
  return OUTDOOR_UNIT_PLACE_LABELS[place];
}

export function getServiceRequestTypeBadgeVariant(type: ServiceRequestType): UiBadgeVariant {
  return REQUEST_TYPE_BADGE_VARIANTS[type];
}

export function getServiceRequestStatusBadgeVariant(status: ServiceRequestStatus): UiBadgeVariant {
  return REQUEST_STATUS_BADGE_VARIANTS[status];
}

export function formatServiceRequestCustomerName(customer: ServiceRequestCustomer): string {
  return customer.companyName || customer.fullName || 'Klient';
}

export function formatServiceRequestCustomerAddress(customer: ServiceRequestCustomer): string {
  const cityLine = [customer.postalCode, customer.city].filter(Boolean).join(' ');

  return [customer.address, cityLine].filter(Boolean).join(', ') || '--';
}

export function formatServiceRequestAppointmentDate(request: ServiceRequest): string {
  if (!request.appointmentDate) {
    return '--';
  }

  return formatDate(request.appointmentDate);
}

export function formatDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    return value || '--';
  }

  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) {
    return value || '--';
  }

  return new Intl.DateTimeFormat('pl-PL').format(date);
}

export function formatOptionalValue(value: string | number | null | undefined, suffix = ''): string {
  if (value === null || value === undefined || value === '') {
    return '--';
  }

  return `${value}${suffix}`;
}

export function formatServiceRequestDeviceName(device: ServiceRequestDevice): string {
  return [device.brand, device.model].filter(Boolean).join(' ') || 'Urządzenie';
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
