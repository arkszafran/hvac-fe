export type DeviceInspectionPreset = 'custom' | '6' | '12';

export const DEVICE_INSPECTION_PRESET_OPTIONS: Array<{
  value: DeviceInspectionPreset;
  label: string;
}> = [
  { value: 'custom', label: 'Wybrana data' },
  { value: '6', label: '6 miesięcy' },
  { value: '12', label: '12 miesięcy' },
];

export const DEVICE_INSPECTIONS_CHECKBOX_LABEL = 'Włącz przeglądy okresowe';
export const DEVICE_INSPECTIONS_CHECKBOX_DESCRIPTION =
  'Po włączeniu trzeba ustawić termin najbliższego przeglądu, będą wysyłane przypomnienia.';

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

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}
