import { TranslocoService } from '@jsverse/transloco';

import type { UiBadgeVariant } from '../../../ui';
import {
  ServiceOrderBuildingType,
  ServiceOrderCustomer,
  CustomerConfirmationStatus,
  ServiceOrder,
  ServiceOrderOutdoorUnitPlace,
  ServiceOrderSource,
  ServiceOrderStatus,
  ServiceOrderType,
} from '../models/service-order.model';

export type ActionableInspectionConfirmationStatus = Exclude<CustomerConfirmationStatus, 'pending'>;

export interface ServiceOrderInspectionConfirmation {
  status: ActionableInspectionConfirmationStatus;
  scheduledAt: string;
  reminderSentAt: string;
}

const TYPE_LABEL_KEYS: Record<ServiceOrderType, string> = {
  installation: 'serviceOrders.types.installation',
  repair: 'serviceOrders.types.repair',
  inspection: 'serviceOrders.types.inspection',
};

const STATUS_LABEL_KEYS: Record<ServiceOrderStatus, string> = {
  new: 'serviceOrders.statuses.new',
  contact_required: 'serviceOrders.statuses.contactRequired',
  scheduled: 'serviceOrders.statuses.scheduled',
  completed: 'serviceOrders.statuses.completed',
  cancelled: 'serviceOrders.statuses.cancelled',
};

const SOURCE_LABEL_KEYS: Record<ServiceOrderSource, string> = {
  'customer-panel': 'serviceOrders.sources.customerPanel',
  'website-form': 'serviceOrders.sources.websiteForm',
  user: 'serviceOrders.sources.user',
  system: 'serviceOrders.sources.system',
};

const BUILDING_TYPE_LABEL_KEYS: Record<ServiceOrderBuildingType, string> = {
  'apartment-block': 'serviceOrders.buildingTypes.apartmentBlock',
  house: 'serviceOrders.buildingTypes.house',
  'office-building': 'serviceOrders.buildingTypes.officeBuilding',
};

const OUTDOOR_UNIT_PLACE_LABEL_KEYS: Record<ServiceOrderOutdoorUnitPlace, string> = {
  wall: 'serviceOrders.outdoorUnitPlaces.wall',
  balcony: 'serviceOrders.outdoorUnitPlaces.balcony',
};

export function getServiceOrderTypeLabel(
  type: ServiceOrderType,
  transloco: TranslocoService,
): string {
  return transloco.translate(TYPE_LABEL_KEYS[type]);
}

export function getServiceOrderStatusLabel(
  status: ServiceOrderStatus,
  transloco: TranslocoService,
): string {
  return transloco.translate(STATUS_LABEL_KEYS[status]);
}

export function getServiceOrderSourceLabel(
  source: ServiceOrderSource,
  transloco: TranslocoService,
): string {
  return transloco.translate(SOURCE_LABEL_KEYS[source]);
}

export function getServiceOrderBuildingTypeLabel(
  type: ServiceOrderBuildingType,
  transloco: TranslocoService,
): string {
  return transloco.translate(BUILDING_TYPE_LABEL_KEYS[type]);
}

export function getServiceOrderOutdoorUnitPlaceLabel(
  place: ServiceOrderOutdoorUnitPlace,
  transloco: TranslocoService,
): string {
  return transloco.translate(OUTDOOR_UNIT_PLACE_LABEL_KEYS[place]);
}

export function getServiceOrderTypeVariant(type: ServiceOrderType): UiBadgeVariant {
  switch (type) {
    case 'installation':
      return 'info';
    case 'repair':
      return 'warning';
    case 'inspection':
      return 'success';
  }
}

export function getServiceOrderStatusVariant(status: ServiceOrderStatus): UiBadgeVariant {
  switch (status) {
    case 'new':
      return 'info';
    case 'contact_required':
      return 'warning';
    case 'scheduled':
      return 'info';
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'danger';
  }
}

export function getServiceOrderInspectionConfirmation(
  order: ServiceOrder,
): ServiceOrderInspectionConfirmation | null {
  if (
    order.type !== 'inspection' ||
    order.serviceData.type !== 'inspection' ||
    order.status !== 'contact_required' ||
    !order.scheduledAt.trim() ||
    order.serviceData.customerConfirmationStatus === 'pending'
  ) {
    return null;
  }

  return {
    status: order.serviceData.customerConfirmationStatus,
    scheduledAt: order.scheduledAt,
    reminderSentAt: order.serviceData.confirmationReminderSentAt ?? '',
  };
}

export function formatServiceOrderCustomerName(customer: ServiceOrderCustomer): string {
  return customer.companyName || customer.fullName || '--';
}

export function formatServiceOrderCustomerAddress(customer: ServiceOrderCustomer): string {
  return (
    [customer.address, `${customer.postalCode} ${customer.city}`.trim()]
      .filter(Boolean)
      .join(', ') || '--'
  );
}

export function formatServiceOrderDate(value: string, locale: string): string {
  if (!value) {
    return '--';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale === 'pl' ? 'pl-PL' : 'en-US').format(date);
}

export function formatServiceOrderDateTime(value: string, locale: string): string {
  if (!value) {
    return '--';
  }

  const date = new Date(withDefaultTime(value));

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale === 'pl' ? 'pl-PL' : 'en-US', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

export function formatServiceOrderNextActionDateTime(
  value: string,
  locale: string,
  currentDate = new Date(),
): { date: string; time: string; isToday: boolean } {
  const date = new Date(withDefaultTime(value));

  if (Number.isNaN(date.getTime())) {
    return { date: value || '--', time: '--', isToday: false };
  }

  return {
    date: new Intl.DateTimeFormat(locale === 'pl' ? 'pl-PL' : 'en-US').format(date),
    time: new Intl.DateTimeFormat(locale === 'pl' ? 'pl-PL' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date),
    isToday:
      date.getFullYear() === currentDate.getFullYear() &&
      date.getMonth() === currentDate.getMonth() &&
      date.getDate() === currentDate.getDate(),
  };
}

export function toServiceOrderDateTimeLocalValue(value: string): string {
  if (!value) {
    return '';
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value}T09:00`;
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(value)) {
    return value.slice(0, 16);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 16);
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

export function serviceOrderPhoneHref(phone: string): string {
  const normalizedPhone = phone.replace(/[^\d+]/g, '');

  return normalizedPhone ? `tel:${normalizedPhone}` : '#';
}

export function serviceOrderMapHref(customer: ServiceOrderCustomer): string {
  const address = [customer.address, `${customer.postalCode} ${customer.city}`.trim()]
    .filter(Boolean)
    .join(', ');

  return address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : '';
}

function withDefaultTime(value: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T09:00` : value;
}
