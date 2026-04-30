import { Customer } from '../../customers/models/customer.model';
import { Device, DeviceDraft } from '../../customers/models/device.model';
import {
  Inspection,
  InspectionCandidate,
  InspectionConflict,
  InspectionCreateInput,
  InspectionStatus,
} from '../models/inspection.model';

const DAY_IN_MS = 24 * 60 * 60 * 1000;
export const INSPECTION_GROUPING_WINDOW_DAYS = 30;
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

export interface DeviceInspectionLike {
  id: string;
  customerId: string;
  hasScheduledInspections: boolean;
  nextInspectionDate: string;
}

export interface InspectionTimeline {
  targetDate: string;
  windowStart: string;
  windowEnd: string;
}

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

  return left < right ? -1 : 1;
}

export function differenceInDays(left: string, right: string): number {
  const leftDate = parseDateInput(left);
  const rightDate = parseDateInput(right);

  if (!leftDate || !rightDate) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.round(Math.abs(leftDate.getTime() - rightDate.getTime()) / DAY_IN_MS);
}

export function isDeviceEligibleForInspection(
  device: Pick<DeviceInspectionLike, 'hasScheduledInspections' | 'nextInspectionDate'>,
): boolean {
  return device.hasScheduledInspections && Boolean(device.nextInspectionDate.trim());
}

export function getCustomerDevice(device: Device, customer: Customer): DeviceInspectionLike {
  return {
    id: device.id,
    customerId: customer.id,
    hasScheduledInspections: device.hasScheduledInspections,
    nextInspectionDate: device.nextInspectionDate,
  };
}

export function createDeviceInspectionSnapshot(
  customerId: string,
  deviceId: string,
  deviceDraft: Pick<DeviceDraft, 'hasScheduledInspections' | 'nextInspectionDate'>,
): DeviceInspectionLike {
  return {
    id: deviceId,
    customerId,
    hasScheduledInspections: deviceDraft.hasScheduledInspections,
    nextInspectionDate: deviceDraft.hasScheduledInspections ? deviceDraft.nextInspectionDate.trim() : '',
  };
}

export function isInspectionOpen(status: InspectionStatus): boolean {
  return OPEN_INSPECTION_STATUSES.includes(status);
}

export function getInspectionTimeline(
  deviceIds: string[],
  devicesById: Map<string, DeviceInspectionLike>,
): InspectionTimeline {
  const dates = deviceIds
    .map((deviceId) => devicesById.get(deviceId))
    .filter((device): device is DeviceInspectionLike => Boolean(device))
    .filter(isDeviceEligibleForInspection)
    .map((device) => device.nextInspectionDate)
    .sort(compareDateInputs);

  const firstDate = dates[0] ?? '';
  const lastDate = dates.at(-1) ?? '';

  return {
    targetDate: firstDate,
    windowStart: firstDate,
    windowEnd: lastDate,
  };
}

export function createInspection(
  input: InspectionCreateInput,
  devicesById: Map<string, DeviceInspectionLike>,
  now = currentTimestamp(),
): Inspection {
  const uniqueDeviceIds = Array.from(new Set(input.deviceIds));
  const timeline = getInspectionTimeline(uniqueDeviceIds, devicesById);

  return {
    id: createEntityId('inspection'),
    customerId: input.customerId,
    deviceIds: uniqueDeviceIds,
    source: input.source ?? 'auto',
    status: input.status ?? 'new',
    targetDate: timeline.targetDate,
    windowStart: timeline.windowStart,
    windowEnd: timeline.windowEnd,
    plannedDate: input.plannedDate?.trim() ?? '',
    reminderSentAt: input.reminderSentAt?.trim() ?? '',
    customerConfirmedAt: input.customerConfirmedAt?.trim() ?? '',
    lastContactAt: input.lastContactAt?.trim() ?? '',
    note: input.note?.trim() ?? '',
    createdAt: now,
    updatedAt: now,
  };
}

export function recalculateInspection(
  inspection: Inspection,
  devicesById: Map<string, DeviceInspectionLike>,
  now = currentTimestamp(),
): Inspection {
  const timeline = getInspectionTimeline(inspection.deviceIds, devicesById);

  return {
    ...inspection,
    targetDate: timeline.targetDate,
    windowStart: timeline.windowStart,
    windowEnd: timeline.windowEnd,
    updatedAt: now,
  };
}

export function inspectionCanIncludeDate(
  inspection: Inspection,
  candidateDate: string,
  devicesById: Map<string, DeviceInspectionLike>,
  ignoredDeviceIds: string[] = [],
): boolean {
  if (!candidateDate.trim()) {
    return false;
  }

  const dates = inspection.deviceIds
    .filter((deviceId) => !ignoredDeviceIds.includes(deviceId))
    .map((deviceId) => devicesById.get(deviceId))
    .filter((device): device is DeviceInspectionLike => Boolean(device))
    .filter(isDeviceEligibleForInspection)
    .map((device) => device.nextInspectionDate);

  dates.push(candidateDate);
  dates.sort(compareDateInputs);

  if (dates.length <= 1) {
    return true;
  }

  return differenceInDays(dates[0], dates.at(-1) ?? dates[0]) <= INSPECTION_GROUPING_WINDOW_DAYS;
}

export function findMatchingInspections(
  customerId: string,
  device: DeviceInspectionLike,
  inspections: Inspection[],
  devicesById: Map<string, DeviceInspectionLike>,
  excludedInspectionIds: string[] = [],
): InspectionCandidate[] {
  if (!isDeviceEligibleForInspection(device)) {
    return [];
  }

  return inspections
    .filter(
      (inspection) =>
        inspection.customerId === customerId &&
        isInspectionOpen(inspection.status) &&
        !excludedInspectionIds.includes(inspection.id) &&
        !inspection.deviceIds.includes(device.id),
    )
    .filter((inspection) =>
      inspectionCanIncludeDate(inspection, device.nextInspectionDate, devicesById),
    )
    .map((inspection) => ({
      inspection,
      targetDateLabel: inspection.plannedDate || inspection.targetDate,
    }))
    .sort((left, right) => compareDateInputs(left.targetDateLabel, right.targetDateLabel));
}

export function groupCustomerDevicesIntoInspections(
  customer: Customer,
  now = currentTimestamp(),
): Inspection[] {
  const devicesById = new Map(
    customer.devices.map((device) => [device.id, getCustomerDevice(device, customer)]),
  );
  const eligibleDevices = customer.devices
    .filter((device) => isDeviceEligibleForInspection(device))
    .slice()
    .sort((left, right) => compareDateInputs(left.nextInspectionDate, right.nextInspectionDate));

  const groups: string[][] = [];

  for (const device of eligibleDevices) {
    const currentGroup = groups.at(-1);

    if (!currentGroup) {
      groups.push([device.id]);
      continue;
    }

    const nextGroupTimeline = getInspectionTimeline([...currentGroup, device.id], devicesById);
    const groupSpan = nextGroupTimeline.windowStart && nextGroupTimeline.windowEnd
      ? differenceInDays(nextGroupTimeline.windowStart, nextGroupTimeline.windowEnd)
      : 0;

    if (groupSpan <= INSPECTION_GROUPING_WINDOW_DAYS) {
      currentGroup.push(device.id);
      continue;
    }

    groups.push([device.id]);
  }

  return groups.map((deviceIds) =>
    createInspection(
      {
        customerId: customer.id,
        deviceIds,
        source: 'auto',
      },
      devicesById,
      now,
    ),
  );
}

export function getInspectionConflict(
  inspection: Inspection,
  devicesById: Map<string, DeviceInspectionLike>,
): InspectionConflict | null {
  const devices = inspection.deviceIds.map((deviceId) => devicesById.get(deviceId));

  if (devices.some((device) => !device)) {
    return {
      code: 'missing_device',
      message: 'Część urządzeń przypisanych do przeglądu nie istnieje już w bazie.',
    };
  }

  if (
    devices.some(
      (device) => device && (!device.hasScheduledInspections || !device.nextInspectionDate.trim()),
    )
  ) {
    return {
      code: 'device_not_eligible',
      message: 'Jedno z urządzeń nie kwalifikuje się już do aktywnego przeglądu okresowego.',
    };
  }

  if (
    inspection.windowStart &&
    inspection.windowEnd &&
    differenceInDays(inspection.windowStart, inspection.windowEnd) > INSPECTION_GROUPING_WINDOW_DAYS
  ) {
    return {
      code: 'date_window',
      message: 'Planowany termin obejmuje ponad 30 dni i wymaga ponownego uporządkowania urządzeń.',
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

  return customer.devices.filter(
    (device) => isDeviceEligibleForInspection(device) && !assignedDeviceIds.has(device.id),
  );
}
