import { Injectable, computed, inject, signal } from '@angular/core';

import { CustomersStore } from '../../customers/data/customers.store';
import { Customer } from '../../customers/models/customer.model';
import { Device } from '../../customers/models/device.model';
import { Inspection } from '../models/inspection.model';
import {
  DeviceInspectionLike,
  createInspection,
  currentTimestamp,
  getCustomerDevice,
  getCustomerDevicesWithoutInspection,
  getInspectionConflict,
  groupCustomerDevicesIntoInspections,
  isDeviceEligibleForInspection,
  isInspectionOpen,
  recalculateInspection,
} from '../utils/inspection-domain.util';
import { getInspectionNextActionLabel } from '../utils/inspection-ui.util';

export interface InspectionDetails {
  inspection: Inspection;
  customer: Customer;
  devices: Device[];
  conflict: ReturnType<typeof getInspectionConflict>;
}

export interface DeviceWithoutInspection {
  customer: Customer;
  device: Device;
}

@Injectable({ providedIn: 'root' })
export class InspectionsStore {
  private readonly customersStore = inject(CustomersStore);
  private readonly inspectionsState = signal<Inspection[]>(
    this.customersStore.customers().flatMap((customer) => groupCustomerDevicesIntoInspections(customer)),
  );

  readonly inspections = this.inspectionsState.asReadonly();

  readonly devicesById = computed(() => {
    const map = new Map<string, DeviceInspectionLike>();

    for (const customer of this.customersStore.customers()) {
      for (const device of customer.devices) {
        map.set(device.id, getCustomerDevice(device, customer));
      }
    }

    return map;
  });

  readonly inspectionDetails = computed<InspectionDetails[]>(() => {
    const customersById = new Map(
      this.customersStore.customers().map((customer) => [customer.id, customer]),
    );
    const devicesById = this.devicesById();

    return this.inspections()
      .map((inspection) => {
        const customer = customersById.get(inspection.customerId);

        if (!customer) {
          return null;
        }

        const devices = inspection.deviceIds
          .map((deviceId) => customer.devices.find((device) => device.id === deviceId))
          .filter((device): device is Device => Boolean(device));

        return {
          inspection,
          customer,
          devices,
          conflict: getInspectionConflict(inspection, devicesById),
        };
      })
      .filter((details): details is InspectionDetails => Boolean(details))
      .sort((left, right) => left.inspection.targetDate.localeCompare(right.inspection.targetDate));
  });

  readonly activeInspectionIdsByDevice = computed(() => {
    const map = new Map<string, string>();

    for (const inspection of this.inspections()) {
      if (!isInspectionOpen(inspection.status)) {
        continue;
      }

      for (const deviceId of inspection.deviceIds) {
        if (!map.has(deviceId)) {
          map.set(deviceId, inspection.id);
        }
      }
    }

    return map;
  });

  readonly devicesWithoutInspection = computed<DeviceWithoutInspection[]>(() =>
    this.customersStore.customers().flatMap((customer) =>
      getCustomerDevicesWithoutInspection(customer, this.inspections()).map((device) => ({
        customer,
        device,
      })),
    ),
  );

  getInspectionById(inspectionId: string): Inspection | undefined {
    return this.inspectionsState().find((inspection) => inspection.id === inspectionId);
  }

  getInspectionDetailsById(inspectionId: string): InspectionDetails | undefined {
    return this.inspectionDetails().find((details) => details.inspection.id === inspectionId);
  }

  getActiveInspectionByDeviceId(deviceId: string): Inspection | undefined {
    const inspectionId = this.activeInspectionIdsByDevice().get(deviceId);

    return inspectionId ? this.getInspectionById(inspectionId) : undefined;
  }

  createInspection(input: {
    customerId: string;
    deviceIds: string[];
    source?: Inspection['source'];
    note?: string;
  }): Inspection | undefined {
    const uniqueDeviceIds = Array.from(new Set(input.deviceIds));

    if (!uniqueDeviceIds.length) {
      return undefined;
    }

    const createdInspection = createInspection(
      {
        customerId: input.customerId,
        deviceIds: uniqueDeviceIds,
        source: input.source,
        note: input.note,
      },
      this.devicesById(),
    );

    this.inspectionsState.update((inspections) => [createdInspection, ...inspections]);

    return createdInspection;
  }

  attachDeviceToInspection(inspectionId: string, deviceId: string): Inspection | undefined {
    let updatedInspection: Inspection | undefined;
    const now = currentTimestamp();

    this.inspectionsState.update((inspections) =>
      inspections.map((inspection) => {
        if (inspection.id !== inspectionId || inspection.deviceIds.includes(deviceId)) {
          return inspection;
        }

        updatedInspection = recalculateInspection(
          {
            ...inspection,
            deviceIds: [...inspection.deviceIds, deviceId],
          },
          this.devicesById(),
          now,
        );

        return updatedInspection;
      }),
    );

    return updatedInspection;
  }

  removeDeviceFromInspection(
    inspectionId: string,
    deviceId: string,
    emptyStrategy: 'delete' | 'cancel' = 'delete',
  ): { updatedInspection?: Inspection; deletedInspection?: Inspection; cancelledInspection?: Inspection } {
    const inspection = this.getInspectionById(inspectionId);

    if (!inspection || !inspection.deviceIds.includes(deviceId)) {
      return {};
    }

    const remainingDeviceIds = inspection.deviceIds.filter((currentId) => currentId !== deviceId);

    if (!remainingDeviceIds.length) {
      if (emptyStrategy === 'cancel') {
        const cancelledInspection = this.cancelInspection(inspectionId);

        return { cancelledInspection };
      }

      this.deleteInspection(inspectionId);

      return { deletedInspection: inspection };
    }

    let updatedInspection: Inspection | undefined;
    const now = currentTimestamp();

    this.inspectionsState.update((inspections) =>
      inspections.map((currentInspection) => {
        if (currentInspection.id !== inspectionId) {
          return currentInspection;
        }

        updatedInspection = recalculateInspection(
          {
            ...currentInspection,
            deviceIds: remainingDeviceIds,
          },
          this.devicesById(),
          now,
        );

        return updatedInspection;
      }),
    );

    return { updatedInspection };
  }

  deleteInspection(inspectionId: string): void {
    this.inspectionsState.update((inspections) =>
      inspections.filter((inspection) => inspection.id !== inspectionId),
    );
  }

  recalculateInspection(inspectionId: string): Inspection | undefined {
    let updatedInspection: Inspection | undefined;
    const now = currentTimestamp();

    this.inspectionsState.update((inspections) =>
      inspections.map((inspection) => {
        if (inspection.id !== inspectionId) {
          return inspection;
        }

        updatedInspection = recalculateInspection(inspection, this.devicesById(), now);

        return updatedInspection;
      }),
    );

    return updatedInspection;
  }

  recalculateCustomerInspections(customerId: string): Inspection[] {
    const updatedInspections: Inspection[] = [];
    const now = currentTimestamp();

    this.inspectionsState.update((inspections) =>
      inspections
        .map((inspection) => {
          if (inspection.customerId !== customerId) {
            return inspection;
          }

          const eligibleDeviceIds = inspection.deviceIds.filter((deviceId) => {
            const device = this.devicesById().get(deviceId);

            return device && isDeviceEligibleForInspection(device);
          });

          if (!eligibleDeviceIds.length && inspection.status !== 'cancelled' && inspection.status !== 'completed') {
            return null;
          }

          const updatedInspection = recalculateInspection(
            {
              ...inspection,
              deviceIds: eligibleDeviceIds,
            },
            this.devicesById(),
            now,
          );

          updatedInspections.push(updatedInspection);

          return updatedInspection;
        })
        .filter((inspection): inspection is Inspection => Boolean(inspection)),
    );

    return updatedInspections;
  }

  markReminderSent(inspectionId: string): Inspection | undefined {
    return this.patchInspection(inspectionId, {
      status: 'reminder_sent',
      reminderSentAt: currentTimestamp(),
      lastContactAt: currentTimestamp(),
    });
  }

  markCustomerConfirmed(inspectionId: string, confirmed: boolean): Inspection | undefined {
    const timestamp = currentTimestamp();

    return this.patchInspection(inspectionId, {
      status: confirmed ? 'customer_confirmed' : 'customer_not_confirmed',
      customerConfirmedAt: confirmed ? timestamp : '',
      lastContactAt: timestamp,
    });
  }

  setPlannedDate(inspectionId: string, plannedDate: string): Inspection | undefined {
    const inspection = this.getInspectionById(inspectionId);
    const normalizedPlannedDate = plannedDate.trim();

    if (!inspection || !normalizedPlannedDate) {
      return undefined;
    }

    this.syncInspectionDeviceDates(inspection, normalizedPlannedDate);

    let updatedInspection: Inspection | undefined;
    const now = currentTimestamp();

    this.inspectionsState.update((inspections) =>
      inspections.map((currentInspection) => {
        if (currentInspection.id !== inspectionId) {
          return currentInspection;
        }

        updatedInspection = recalculateInspection(
          {
            ...currentInspection,
            status: 'scheduled',
            plannedDate: normalizedPlannedDate,
          },
          this.devicesById(),
          now,
        );

        return updatedInspection;
      }),
    );

    return updatedInspection;
  }

  markCompleted(inspectionId: string): Inspection | undefined {
    return this.patchInspection(inspectionId, {
      status: 'completed',
    });
  }

  cancelInspection(inspectionId: string): Inspection | undefined {
    return this.patchInspection(inspectionId, {
      status: 'cancelled',
    });
  }

  cancelInspectionAndDisableDeviceInspections(inspectionId: string): Inspection | undefined {
    const inspection = this.getInspectionById(inspectionId);

    if (!inspection) {
      return undefined;
    }

    for (const deviceId of inspection.deviceIds) {
      this.customersStore.updateDeviceInspectionSettings(inspection.customerId, deviceId, {
        hasScheduledInspections: false,
        nextInspectionDate: '',
      });
    }

    return this.cancelInspection(inspectionId);
  }

  getNextActionLabel(inspection: Inspection): string {
    return getInspectionNextActionLabel(inspection.status);
  }

  private patchInspection(
    inspectionId: string,
    patch: Partial<Omit<Inspection, 'id' | 'customerId' | 'deviceIds' | 'createdAt'>>,
  ): Inspection | undefined {
    let updatedInspection: Inspection | undefined;
    const now = currentTimestamp();

    this.inspectionsState.update((inspections) =>
      inspections.map((inspection) => {
        if (inspection.id !== inspectionId) {
          return inspection;
        }

        updatedInspection = {
          ...inspection,
          ...patch,
          updatedAt: now,
        };

        return updatedInspection;
      }),
    );

    return updatedInspection;
  }

  private syncInspectionDeviceDates(inspection: Inspection, plannedDate: string): void {
    for (const deviceId of inspection.deviceIds) {
      this.customersStore.updateDeviceInspectionSettings(inspection.customerId, deviceId, {
        hasScheduledInspections: true,
        nextInspectionDate: plannedDate,
      });
    }
  }
}
