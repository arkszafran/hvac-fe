export type DeviceType = 'air-conditioning' | 'heat-pump' | 'ventilation' | '';

export interface DeviceServiceHistoryEntry {
  id: string;
  date: string;
  title: string;
  technician: string;
  note: string;
}

export interface Device {
  id: string;
  type: DeviceType;
  brand: string;
  model: string;
  serialNumber: string;
  installationDate: string;
  warrantyMonths: number;
  warrantyUntil: string;
  nextInspectionDate: string;
  note: string;
  refrigerant: string;
  refrigerantAmount: string;
  location: string;
  hasCustomInstallationAddress: boolean;
  address: string;
  postalCode: string;
  city: string;
  serviceHistory: DeviceServiceHistoryEntry[];
}

export type DeviceDraft = Omit<Device, 'id' | 'warrantyUntil'>;

export const DEVICE_TYPE_OPTIONS: Array<{ value: DeviceType; label: string }> = [
  { value: 'air-conditioning', label: 'Klimatyzacja' },
  { value: 'heat-pump', label: 'Pompa ciepła' },
  { value: 'ventilation', label: 'Rekuperacja' },
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

export const DEVICE_WARRANTY_MONTH_OPTIONS = DEVICE_WARRANTY_MONTH_VALUES.map((months) => ({
  value: months.toString(),
  label: formatWarrantyOptionLabel(months),
}));

export function createEmptyDeviceDraft(): DeviceDraft {
  return {
    type: '',
    brand: '',
    model: '',
    serialNumber: '',
    installationDate: '',
    warrantyMonths: 0,
    nextInspectionDate: '',
    note: '',
    refrigerant: '',
    refrigerantAmount: '',
    location: '',
    hasCustomInstallationAddress: false,
    address: '',
    postalCode: '',
    city: '',
    serviceHistory: [],
  };
}

export function getDeviceTypeLabel(type: DeviceType): string {
  switch (type) {
    case 'air-conditioning':
      return 'Klimatyzacja';
    case 'heat-pump':
      return 'Pompa ciepła';
    case 'ventilation':
      return 'Rekuperacja';
    default:
      return 'Nie określono';
  }
}

function formatWarrantyOptionLabel(months: number): string {
  if (months === 0) {
    return 'Brak';
  }

  return `${formatMonthsLabel(months)} (${formatYearsLabel(months)})`;
}

function formatMonthsLabel(months: number): string {
  const mod10 = months % 10;
  const mod100 = months % 100;

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${months} miesiące`;
  }

  return `${months} miesięcy`;
}

function formatYearsLabel(months: number): string {
  if (months === 6) {
    return '0,5 roku';
  }

  const years = months / 12;

  if (years === 1) {
    return '1 rok';
  }

  if (years >= 2 && years <= 4) {
    return `${years} lata`;
  }

  return `${years} lat`;
}
