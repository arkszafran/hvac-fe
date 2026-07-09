import { Injectable, computed, inject, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

import { CustomersStore } from '../../customers/data/customers.store';
import { Customer } from '../../customers/models/customer.model';
import { Device } from '../../customers/models/device.model';
import { Inspection } from '../models/inspection.model';
import {
  compareDateInputs,
  createInspection,
  currentTimestamp,
  getCustomerDevicesWithoutInspection,
  getInspectionConflict,
  isInspectionOpen,
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
  private readonly transloco = inject(TranslocoService);
  private readonly inspectionsState = signal<Inspection[]>(createInitialInspectionMocks());

  readonly inspections = this.inspectionsState.asReadonly();

  readonly devicesById = computed(() => {
    const map = new Map<string, Device>();

    for (const customer of this.customersStore.customers()) {
      for (const device of customer.devices) {
        map.set(device.id, device);
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
      .sort((left, right) =>
        compareDateInputs(left.inspection.inspectionDate, right.inspection.inspectionDate),
      );
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

  getActiveInspectionsByCustomerId(customerId: string, excludedDeviceId = ''): Inspection[] {
    return this.inspections()
      .filter(
        (inspection) =>
          inspection.customerId === customerId &&
          isInspectionOpen(inspection.status) &&
          (!excludedDeviceId || !inspection.deviceIds.includes(excludedDeviceId)),
      )
      .sort((left, right) => compareDateInputs(left.inspectionDate, right.inspectionDate));
  }

  createInspection(input: {
    customerId: string;
    deviceIds: string[];
    source?: Inspection['source'];
    status?: Inspection['status'];
    inspectionDate?: string;
    note?: string;
  }): Inspection | undefined {
    const uniqueDeviceIds = Array.from(new Set(input.deviceIds));

    if (!uniqueDeviceIds.length) {
      return undefined;
    }

    const createdInspection = createInspection({
      customerId: input.customerId,
      deviceIds: uniqueDeviceIds,
      source: input.source,
      status: input.status,
      inspectionDate: input.inspectionDate,
      note: input.note,
    });

    this.inspectionsState.update((inspections) => [createdInspection, ...inspections]);

    return createdInspection;
  }

  attachDeviceToInspection(inspectionId: string, deviceId: string): Inspection | undefined {
    let updatedInspection: Inspection | undefined;
    const now = currentTimestamp();

    this.inspectionsState.update((inspections) => {
      const targetInspection = inspections.find((inspection) => inspection.id === inspectionId);

      if (!targetInspection) {
        return inspections;
      }

      return inspections
        .map((inspection) => {
          if (
            inspection.id !== inspectionId &&
            isInspectionOpen(inspection.status) &&
            inspection.deviceIds.includes(deviceId)
          ) {
            return {
              ...inspection,
              deviceIds: inspection.deviceIds.filter((currentId) => currentId !== deviceId),
              updatedAt: now,
            };
          }

          if (inspection.id !== inspectionId || inspection.deviceIds.includes(deviceId)) {
            if (inspection.id === inspectionId) {
              updatedInspection = inspection;
            }

            return inspection;
          }

          updatedInspection = {
            ...inspection,
            deviceIds: [...inspection.deviceIds, deviceId],
            updatedAt: now,
          };

          return updatedInspection;
        })
        .filter((inspection) => inspection.deviceIds.length || inspection.status === 'completed' || inspection.status === 'cancelled');
    });

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

        updatedInspection = {
          ...currentInspection,
          deviceIds: remainingDeviceIds,
          updatedAt: now,
        };

        return updatedInspection;
      }),
    );

    return { updatedInspection };
  }

  moveDeviceToNewInspection(
    customerId: string,
    currentInspectionId: string,
    deviceId: string,
    inspectionDate: string,
  ): Inspection | undefined {
    this.removeDeviceFromInspection(currentInspectionId, deviceId);

    return this.createInspection({
      customerId,
      deviceIds: [deviceId],
      inspectionDate,
      source: 'manual',
    });
  }

  deleteInspection(inspectionId: string): void {
    this.inspectionsState.update((inspections) =>
      inspections.filter((inspection) => inspection.id !== inspectionId),
    );
  }

  setInspectionDate(inspectionId: string, inspectionDate: string): Inspection | undefined {
    const normalizedInspectionDate = inspectionDate.trim();

    if (!normalizedInspectionDate) {
      return undefined;
    }

    return this.patchInspection(inspectionId, {
      status: 'scheduled',
      inspectionDate: normalizedInspectionDate,
    });
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
    return this.cancelInspection(inspectionId);
  }

  getNextActionLabel(inspection: Inspection): string {
    return getInspectionNextActionLabel(inspection.status, this.transloco);
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
}

function createInitialInspectionMocks(): Inspection[] {
  const now = currentTimestamp();

  return [
    {
      id: 'inspection-01',
      customerId: 'customer-01',
      deviceIds: ['device-01', 'device-02'],
      source: 'auto',
      status: 'new',
      inspectionDate: '2026-05-12',
      reminderSentAt: '',
      customerConfirmedAt: '',
      lastContactAt: '',
      note: '',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'inspection-02',
      customerId: 'customer-02',
      deviceIds: ['device-03'],
      source: 'auto',
      status: 'new',
      inspectionDate: '2026-05-24',
      reminderSentAt: '',
      customerConfirmedAt: '',
      lastContactAt: '',
      note: '',
      createdAt: now,
      updatedAt: now,
    },
  ];
}
