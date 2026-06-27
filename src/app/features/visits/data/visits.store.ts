import { Injectable, computed, inject, signal } from '@angular/core';

import { CustomersStore } from '../../customers/data/customers.store';
import { Customer } from '../../customers/models/customer.model';
import { Device } from '../../customers/models/device.model';
import { Visit, VisitDraft, VisitType } from '../models/visit.model';

export interface VisitDetails {
  visit: Visit;
  customer: Customer;
  devices: Device[];
}

@Injectable({ providedIn: 'root' })
export class VisitsStore {
  private readonly customersStore = inject(CustomersStore);
  private readonly visitsState = signal<Visit[]>(this.createInitialVisits());

  readonly visits = this.visitsState.asReadonly();

  readonly visitDetails = computed<VisitDetails[]>(() => {
    const customersById = new Map(
      this.customersStore.customers().map((customer) => [customer.id, customer]),
    );

    return this.visits()
      .map((visit) => {
        const customer = customersById.get(visit.customerId);

        if (!customer) {
          return null;
        }

        const devices = visit.devicesList
          .map((deviceId) => customer.devices.find((device) => device.id === deviceId))
          .filter((device): device is Device => Boolean(device));

        return {
          visit,
          customer,
          devices,
        };
      })
      .filter((details): details is VisitDetails => Boolean(details))
      .sort((left, right) => right.visit.date.localeCompare(left.visit.date));
  });

  getVisitsForDevice(deviceId: string): VisitDetails[] {
    return this.visitDetails()
      .filter((details) => details.visit.devicesList.includes(deviceId))
      .sort((left, right) => right.visit.date.localeCompare(left.visit.date));
  }

  createVisit(draft: VisitDraft): Visit | undefined {
    const devicesList = Array.from(new Set(draft.devicesList.map((id) => id.trim()).filter(Boolean)));

    if (!draft.customerId.trim() || !devicesList.length || !draft.date.trim()) {
      return undefined;
    }

    const visit: Visit = {
      id: createEntityId('visit'),
      requestId: draft.requestId?.trim() || undefined,
      customerId: draft.customerId.trim(),
      devicesList,
      date: draft.date.trim(),
      type: draft.type,
      devicesNotes: devicesList.map((deviceId) => ({
        deviceId,
        note: draft.devicesNotes.find((item) => item.deviceId === deviceId)?.note.trim() ?? '',
      })),
      createdAt: new Date().toISOString(),
    };

    this.visitsState.update((visits) => [visit, ...visits]);

    return visit;
  }

  private createInitialVisits(): Visit[] {
    return this.customersStore.customers().flatMap((customer) =>
      customer.devices.flatMap((device) =>
        device.serviceHistory.map((entry) => ({
          id: `visit-${entry.id}`,
          customerId: customer.id,
          devicesList: [device.id],
          date: entry.date,
          type: inferVisitType(entry.title),
          devicesNotes: [
            {
              deviceId: device.id,
              note: entry.note,
            },
          ],
          createdAt: `${entry.date}T00:00:00.000Z`,
        })),
      ),
    );
  }
}

function inferVisitType(title: string): VisitType {
  const normalizedTitle = normalizeValue(title);

  if (normalizedTitle.includes('uruchom') || normalizedTitle.includes('montaz')) {
    return 'installation';
  }

  if (normalizedTitle.includes('przeglad')) {
    return 'inspection';
  }

  return 'repair';
}

function normalizeValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function createEntityId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
