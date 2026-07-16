import { TranslocoService } from '@jsverse/transloco';

import type { Visit } from '../../visits/models/visit.model';

export type DeviceType = 'air-conditioning' | 'heat-pump' | 'ventilation' | '';

export interface Device {
  id: string;
  type: DeviceType;
  brand: string;
  model: string;
  serialNumber: string;
  installationDate: string;
  warrantyMonths: number;
  warrantyUntil: string;
  note: string;
  refrigerant: string;
  refrigerantAmount: string;
  location: string;
  hasCustomInstallationAddress: boolean;
  address: string;
  postalCode: string;
  city: string;
  visits: Visit[];
}

export interface DeviceInspectionDraft {
  hasScheduledInspections: boolean;
  nextInspectionDate: string;
}

export type DeviceDraft = Omit<Device, 'id' | 'warrantyUntil' | 'visits'> & DeviceInspectionDraft;

export const DEVICE_TYPE_OPTIONS: Array<{ value: DeviceType; labelKey: string }> = [
  { value: 'air-conditioning', labelKey: 'devices.types.airConditioning' },
  { value: 'heat-pump', labelKey: 'devices.types.heatPump' },
  { value: 'ventilation', labelKey: 'devices.types.ventilation' },
];

const DEVICE_WARRANTY_MONTH_VALUES = [
  0,
  6,
  12,
  24,
  36,
  48,
  60,
  72,
  84,
  96,
  108,
  120,
  132,
  144,
] as const;

export function createEmptyDeviceDraft(): DeviceDraft {
  return {
    type: '',
    brand: '',
    model: '',
    serialNumber: '',
    installationDate: '',
    warrantyMonths: 0,
    hasScheduledInspections: false,
    nextInspectionDate: '',
    note: '',
    refrigerant: '',
    refrigerantAmount: '',
    location: '',
    hasCustomInstallationAddress: false,
    address: '',
    postalCode: '',
    city: '',
  };
}

export function createDeviceTypeOptions(transloco: TranslocoService): Array<{
  value: DeviceType;
  label: string;
}> {
  return DEVICE_TYPE_OPTIONS.map((option) => ({
    value: option.value,
    label: transloco.translate(option.labelKey),
  }));
}

export function createDeviceWarrantyMonthOptions(transloco: TranslocoService): Array<{
  value: string;
  label: string;
}> {
  return DEVICE_WARRANTY_MONTH_VALUES.map((months) => ({
    value: months.toString(),
    label: formatWarrantyOptionLabel(months, transloco),
  }));
}

export function getDeviceTypeLabel(type: DeviceType, transloco: TranslocoService): string {
  switch (type) {
    case 'air-conditioning':
      return transloco.translate('devices.types.airConditioning');
    case 'heat-pump':
      return transloco.translate('devices.types.heatPump');
    case 'ventilation':
      return transloco.translate('devices.types.ventilation');
    default:
      return transloco.translate('common.notSpecified');
  }
}

function formatWarrantyOptionLabel(months: number, transloco: TranslocoService): string {
  if (months === 0) {
    return transloco.translate('common.empty');
  }

  return transloco.translate('devices.warranty.option', {
    months: formatMonthsLabel(months, transloco),
    years: formatYearsLabel(months, transloco),
  });
}

function formatMonthsLabel(months: number, transloco: TranslocoService): string {
  const mod10 = months % 10;
  const mod100 = months % 100;

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return transloco.translate('devices.warranty.monthsFew', { months });
  }

  return transloco.translate('devices.warranty.monthsMany', { months });
}

function formatYearsLabel(months: number, transloco: TranslocoService): string {
  if (months === 6) {
    return transloco.translate('devices.warranty.halfYear');
  }

  const years = months / 12;

  if (years === 1) {
    return transloco.translate('devices.warranty.oneYear');
  }

  if (years >= 2 && years <= 4) {
    return transloco.translate('devices.warranty.yearsFew', { years });
  }

  return transloco.translate('devices.warranty.yearsMany', { years });
}
