import { UiBadgeVariant } from '../../../ui';
import { Inspection, InspectionStatus, InspectionSummaryInput } from '../models/inspection.model';

export function formatInspectionDate(value: string): string {
  if (!value) {
    return '--';
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('pl-PL').format(parsedDate);
}

export function formatInspectionWindow(windowStart: string, windowEnd: string): string {
  if (!windowStart && !windowEnd) {
    return '--';
  }

  if (!windowStart || !windowEnd || windowStart === windowEnd) {
    return formatInspectionDate(windowStart || windowEnd);
  }

  return `${formatInspectionDate(windowStart)} - ${formatInspectionDate(windowEnd)}`;
}

export function getInspectionStatusLabel(status: InspectionStatus): string {
  switch (status) {
    case 'new':
      return 'Nowy';
    case 'reminder_sent':
      return 'Przypomnienie wyslane';
    case 'customer_confirmed':
      return 'Klient potwierdzil';
    case 'customer_not_confirmed':
      return 'Klient nie potwierdzil';
    case 'scheduled':
      return 'Umowiony';
    case 'completed':
      return 'Zakonczony';
    case 'cancelled':
      return 'Anulowany';
  }
}

export function getInspectionStatusVariant(status: InspectionStatus): UiBadgeVariant {
  switch (status) {
    case 'new':
      return 'info';
    case 'reminder_sent':
      return 'warning';
    case 'customer_confirmed':
      return 'success';
    case 'customer_not_confirmed':
      return 'warning';
    case 'scheduled':
      return 'info';
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'danger';
  }
}

export function getInspectionNextActionLabel(status: InspectionStatus): string {
  switch (status) {
    case 'new':
      return 'Wyslij przypomnienie';
    case 'reminder_sent':
      return 'Wyslano przypomnienie';
    case 'customer_confirmed':
      return 'Zadzwon i ustal termin';
    case 'customer_not_confirmed':
      return 'Zadzwon i przypomnij o przegladzie';
    case 'scheduled':
      return 'Przeglad umowiony';
    case 'completed':
      return 'Zakonczony';
    case 'cancelled':
      return 'Anulowany';
  }
}

export function getInspectionScheduleActionLabel(status: InspectionStatus): string {
  return status === 'scheduled' ? 'Zmien termin' : 'Potwierdz termin';
}

export function canScheduleInspection(status: InspectionStatus): boolean {
  return (
    status === 'new' ||
    status === 'reminder_sent' ||
    status === 'customer_confirmed' ||
    status === 'customer_not_confirmed' ||
    status === 'scheduled'
  );
}

export function canCompleteInspection(status: InspectionStatus): boolean {
  return status !== 'completed' && status !== 'cancelled';
}

export function buildInspectionShortDescription(input: InspectionSummaryInput): string {
  const plannedLabel = input.plannedDate
    ? `Termin: ${formatInspectionDate(input.plannedDate)}`
    : `Data docelowa: ${formatInspectionDate(input.windowStart)}`;

  return `${getInspectionStatusLabel(input.status)} • ${formatInspectionWindow(input.windowStart, input.windowEnd)} • ${input.deviceCount} urz. • ${plannedLabel}`;
}

export function getInspectionTimelineDescription(inspection: Inspection): string {
  return inspection.plannedDate
    ? `Umowiony termin: ${formatInspectionDate(inspection.plannedDate)}`
    : `Okno przegladu: ${formatInspectionWindow(inspection.windowStart, inspection.windowEnd)}`;
}
