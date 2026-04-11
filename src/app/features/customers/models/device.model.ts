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

export type DeviceDraft = Omit<Device, 'id'>;

export const DEVICE_TYPE_OPTIONS: Array<{ value: DeviceType; label: string }> = [
  { value: 'air-conditioning', label: 'Klimatyzacja' },
  { value: 'heat-pump', label: 'Pompa ciepła' },
  { value: 'ventilation', label: 'Rekuperacja' },
];

export function createEmptyDeviceDraft(): DeviceDraft {
  return {
    type: '',
    brand: '',
    model: '',
    serialNumber: '',
    installationDate: '',
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
