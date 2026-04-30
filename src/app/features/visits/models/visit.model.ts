export type VisitType = 'installation' | 'repair' | 'inspection';

export interface DeviceNote {
  deviceId: string;
  note: string;
}

export interface Visit {
  id: string;
  customerId: string;
  devicesList: string[];
  date: string;
  type: VisitType;
  devicesNotes: DeviceNote[];
  createdAt: string;
}

export interface VisitDraft {
  customerId: string;
  devicesList: string[];
  date: string;
  type: VisitType;
  devicesNotes: DeviceNote[];
}

export const VISIT_TYPE_OPTIONS: Array<{ value: VisitType; label: string }> = [
  { value: 'installation', label: 'Montaż' },
  { value: 'repair', label: 'Naprawa' },
  { value: 'inspection', label: 'Przegląd' },
];

export function getVisitTypeLabel(type: VisitType): string {
  switch (type) {
    case 'installation':
      return 'Montaż';
    case 'repair':
      return 'Naprawa';
    case 'inspection':
      return 'Przegląd';
  }
}
