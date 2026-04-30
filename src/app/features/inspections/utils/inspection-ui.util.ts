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
      return 'Przypomnienie wysłane';
    case 'customer_confirmed':
      return 'Klient potwierdził';
    case 'customer_not_confirmed':
      return 'Klient nie potwierdził';
    case 'scheduled':
      return 'Umówiony';
    case 'completed':
      return 'Zakończony';
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
      return 'Wyślij przypomnienie';
    case 'reminder_sent':
      return 'Wysłano przypomnienie';
    case 'customer_confirmed':
      return 'Zadzwoń i ustal termin';
    case 'customer_not_confirmed':
      return 'Zadzwoń i przypomnij o przeglądzie';
    case 'scheduled':
      return 'Przegląd umówiony';
    case 'completed':
      return 'Zakończony';
    case 'cancelled':
      return 'Anulowany';
  }
}

export function getInspectionScheduleActionLabel(status: InspectionStatus): string {
  return status === 'scheduled' ? 'Zmień termin' : 'Potwierdź termin';
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
    ? `Umówiony termin: ${formatInspectionDate(inspection.plannedDate)}`
    : `Okno przeglądu: ${formatInspectionWindow(inspection.windowStart, inspection.windowEnd)}`;
}
