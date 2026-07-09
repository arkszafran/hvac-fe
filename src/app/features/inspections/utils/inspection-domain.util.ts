import { Customer } from '../../customers/models/customer.model';
import { Device } from '../../customers/models/device.model';
import {
  Inspection,
  InspectionCandidate,
  InspectionConflict,
  InspectionCreateInput,
  InspectionStatus,
} from '../models/inspection.model';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const OPEN_INSPECTION_STATUSES: readonly InspectionStatus[] = [
  'new',
  'reminder_sent',
  'customer_confirmed',
  'customer_not_confirmed',
  'scheduled',
];

export const FLEXIBLE_INSPECTION_STATUSES: readonly InspectionStatus[] = [
  'new',
  'reminder_sent',
  'customer_confirmed',
  'customer_not_confirmed',
];

export function createEntityId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function currentTimestamp(): string {
  return new Date().toISOString();
}

export function parseDateInput(value: string): Date | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const [year, month, day] = trimmed.split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const timestamp = Date.UTC(year, month - 1, day);
  const date = new Date(timestamp);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateInput(date: Date): string {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${date.getUTCDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function addDays(value: string, days: number): string {
  const parsedDate = parseDateInput(value);

  if (!parsedDate) {
    return value;
  }

  return formatDateInput(new Date(parsedDate.getTime() + days * DAY_IN_MS));
}

export function compareDateInputs(left: string, right: string): number {
  if (left === right) {
    return 0;
  }

  if (!left) {
    return 1;
  }

  if (!right) {
    return -1;
  }

  return left < right ? -1 : 1;
}

export function isInspectionOpen(status: InspectionStatus): boolean {
  return OPEN_INSPECTION_STATUSES.includes(status);
}

export function createInspection(
  input: InspectionCreateInput,
  now = currentTimestamp(),
): Inspection {
  const uniqueDeviceIds = Array.from(new Set(input.deviceIds));

  return {
    id: createEntityId('inspection'),
    customerId: input.customerId,
    deviceIds: uniqueDeviceIds,
    source: input.source ?? 'auto',
    status: input.status ?? 'new',
    inspectionDate: input.inspectionDate?.trim() ?? '',
    reminderSentAt: input.reminderSentAt?.trim() ?? '',
    customerConfirmedAt: input.customerConfirmedAt?.trim() ?? '',
    lastContactAt: input.lastContactAt?.trim() ?? '',
    note: input.note?.trim() ?? '',
    createdAt: now,
    updatedAt: now,
  };
}

export function findMatchingInspections(
  customerId: string,
  deviceId: string,
  inspections: Inspection[],
  excludedInspectionIds: string[] = [],
): InspectionCandidate[] {
  return inspections
    .filter(
      (inspection) =>
        inspection.customerId === customerId &&
        isInspectionOpen(inspection.status) &&
        !excludedInspectionIds.includes(inspection.id) &&
        !inspection.deviceIds.includes(deviceId),
    )
    .map((inspection) => ({
      inspection,
      inspectionDateLabel: inspection.inspectionDate,
    }))
    .sort((left, right) =>
      compareDateInputs(left.inspectionDateLabel, right.inspectionDateLabel),
    );
}

export function getInspectionConflict(
  inspection: Inspection,
  devicesById: Map<string, Device>,
): InspectionConflict | null {
  const devices = inspection.deviceIds.map((deviceId) => devicesById.get(deviceId));

  if (devices.some((device) => !device)) {
    return {
      code: 'missing_device',
      messageKey: 'inspections.conflicts.missingDevice',
    };
  }

  return null;
}

export function getCustomerDevicesWithoutInspection(
  customer: Customer,
  inspections: Inspection[],
): Device[] {
  const assignedDeviceIds = new Set(
    inspections
      .filter((inspection) => inspection.customerId === customer.id && isInspectionOpen(inspection.status))
      .flatMap((inspection) => inspection.deviceIds),
  );

  return customer.devices.filter((device) => !assignedDeviceIds.has(device.id));
}
