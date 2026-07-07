import { TranslocoService } from '@jsverse/transloco';

export type VisitType = 'installation' | 'repair' | 'inspection';

export interface DeviceNote {
  deviceId: string;
  note: string;
}

export interface Visit {
  id: string;
  requestId?: string;
  customerId: string;
  devicesList: string[];
  date: string;
  type: VisitType;
  devicesNotes: DeviceNote[];
  createdAt: string;
}

export interface VisitDraft {
  requestId?: string;
  customerId: string;
  devicesList: string[];
  date: string;
  type: VisitType;
  devicesNotes: DeviceNote[];
}

export interface VisitTypeOption {
  value: VisitType;
  labelKey: string;
}

export const VISIT_TYPE_OPTIONS: readonly VisitTypeOption[] = [
  { value: 'installation', labelKey: 'visits.types.installation' },
  { value: 'repair', labelKey: 'visits.types.repair' },
  { value: 'inspection', labelKey: 'visits.types.inspection' },
];

export function createVisitTypeOptions(transloco: TranslocoService): Array<{ value: VisitType; label: string }> {
  return VISIT_TYPE_OPTIONS.map((option) => ({
    value: option.value,
    label: transloco.translate(option.labelKey),
  }));
}

export function getVisitTypeLabel(type: VisitType, transloco: TranslocoService): string {
  const option = VISIT_TYPE_OPTIONS.find((item) => item.value === type);

  return option ? transloco.translate(option.labelKey) : type;
}
