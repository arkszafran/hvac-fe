import { TranslocoService } from '@jsverse/transloco';

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

export function getInspectionStatusLabel(
  status: InspectionStatus,
  transloco: TranslocoService,
): string {
  return transloco.translate(getInspectionStatusLabelKey(status));
}

export function getInspectionStatusLabelKey(status: InspectionStatus): string {
  switch (status) {
    case 'new':
      return 'inspections.status.new';
    case 'reminder_sent':
      return 'inspections.status.reminderSent';
    case 'customer_confirmed':
      return 'inspections.status.customerConfirmed';
    case 'customer_not_confirmed':
      return 'inspections.status.customerNotConfirmed';
    case 'scheduled':
      return 'inspections.status.scheduled';
    case 'completed':
      return 'inspections.status.completed';
    case 'cancelled':
      return 'inspections.status.cancelled';
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

export function getInspectionNextActionLabel(
  status: InspectionStatus,
  transloco: TranslocoService,
): string {
  return transloco.translate(getInspectionNextActionLabelKey(status));
}

export function getInspectionNextActionLabelKey(status: InspectionStatus): string {
  switch (status) {
    case 'new':
      return 'inspections.nextActions.sendReminder';
    case 'reminder_sent':
      return 'inspections.nextActions.reminderSent';
    case 'customer_confirmed':
      return 'inspections.nextActions.callAndSchedule';
    case 'customer_not_confirmed':
      return 'inspections.nextActions.callAndRemind';
    case 'scheduled':
      return 'inspections.nextActions.scheduled';
    case 'completed':
      return 'inspections.nextActions.completed';
    case 'cancelled':
      return 'inspections.nextActions.cancelled';
  }
}

export function getInspectionScheduleActionLabel(
  status: InspectionStatus,
  transloco: TranslocoService,
): string {
  return transloco.translate(
    status === 'scheduled'
      ? 'inspections.scheduleActions.changeDate'
      : 'inspections.scheduleActions.confirmDate',
  );
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

export function buildInspectionShortDescription(
  input: InspectionSummaryInput,
  transloco: TranslocoService,
): string {
  const plannedLabel = input.plannedDate
    ? transloco.translate('inspections.summary.plannedDate', {
        date: formatInspectionDate(input.plannedDate),
      })
    : transloco.translate('inspections.summary.targetDate', {
        date: formatInspectionDate(input.windowStart),
      });

  return transloco.translate('inspections.summary.shortDescription', {
    status: getInspectionStatusLabel(input.status, transloco),
    window: formatInspectionWindow(input.windowStart, input.windowEnd),
    deviceCount: input.deviceCount,
    plannedLabel,
  });
}

export function getInspectionTimelineDescription(
  inspection: Inspection,
  transloco: TranslocoService,
): string {
  return inspection.plannedDate
    ? transloco.translate('inspections.timeline.plannedDate', {
        date: formatInspectionDate(inspection.plannedDate),
      })
    : transloco.translate('inspections.timeline.window', {
        window: formatInspectionWindow(inspection.windowStart, inspection.windowEnd),
      });
}
