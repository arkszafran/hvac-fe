import { TranslocoService } from '@jsverse/transloco';

export type DeviceInspectionPreset = 'custom' | '6' | '12';

export const DEVICE_INSPECTION_PRESET_OPTIONS: Array<{
  value: DeviceInspectionPreset;
  labelKey: string;
}> = [
  { value: 'custom', labelKey: 'devices.inspections.presets.custom' },
  { value: '6', labelKey: 'devices.inspections.presets.sixMonths' },
  { value: '12', labelKey: 'devices.inspections.presets.twelveMonths' },
];

export const DEVICE_INSPECTIONS_CHECKBOX_LABEL_KEY = 'devices.inspections.checkboxLabel';
export const DEVICE_INSPECTIONS_CHECKBOX_DESCRIPTION_KEY =
  'devices.inspections.checkboxDescription';

export function createDeviceInspectionPresetOptions(transloco: TranslocoService): Array<{
  value: DeviceInspectionPreset;
  label: string;
}> {
  return DEVICE_INSPECTION_PRESET_OPTIONS.map((option) => ({
    value: option.value,
    label: transloco.translate(option.labelKey),
  }));
}

export function calculateInspectionDateFromPreset(
  preset: DeviceInspectionPreset,
  baseDate: Date = new Date(),
): string {
  if (preset === 'custom') {
    return '';
  }

  const parsedMonths = Number(preset);

  if (!parsedMonths) {
    return '';
  }

  const result = new Date(baseDate);
  result.setHours(0, 0, 0, 0);
  result.setMonth(result.getMonth() + parsedMonths);

  return formatDateInput(result);
}

export function toInspectionDateTimeLocalValue(value: string): string {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return '';
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
    return `${normalizedValue}T09:00`;
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(normalizedValue)) {
    return normalizedValue.slice(0, 16);
  }

  const parsedDate = new Date(normalizedValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return '';
  }

  const localDate = new Date(parsedDate.getTime() - parsedDate.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}
