import { Injectable, inject } from '@angular/core';

import { CustomersStore } from '../../customers/data/customers.store';
import { Customer, CustomerDraft } from '../../customers/models/customer.model';
import { Device, DeviceDraft } from '../../customers/models/device.model';
import { Inspection } from '../models/inspection.model';
import {
  DeviceInspectionLike,
  FLEXIBLE_INSPECTION_STATUSES,
  createDeviceInspectionSnapshot,
  findMatchingInspections,
  inspectionCanIncludeDate,
  isDeviceEligibleForInspection,
} from '../utils/inspection-domain.util';
import { buildInspectionShortDescription } from '../utils/inspection-ui.util';
import { InspectionsStore } from './inspections.store';

export type DeviceCustomerSelection =
  | { kind: 'existing'; customer: Customer }
  | { kind: 'new'; draft: CustomerDraft };

export type InspectionResolutionChoice =
  | { kind: 'attach'; inspectionId: string }
  | { kind: 'create-new' };

export interface DeviceInspectionTransactionResult {
  customer: Customer;
  device: Device;
  inspectionToCreate?: Inspection;
  inspectionToAttach?: Inspection;
  inspectionToDetach?: Inspection;
  inspectionToDelete?: Inspection;
  inspectionToCancel?: Inspection;
}

interface InspectionPromptBase {
  title: string;
  description: string;
  customerName: string;
  deviceName: string;
  createActionLabel: string;
  cancelActionLabel: string;
  transition: 'none' | 'detach-current' | 'cancel-current';
  currentInspectionId?: string;
}

export type DeviceCreateInspectionPlan =
  | { kind: 'save-only' }
  | { kind: 'auto-create' }
  | (InspectionPromptBase & {
      kind: 'single-candidate';
      candidate: Inspection;
      primaryActionLabel: string;
    })
  | (InspectionPromptBase & {
      kind: 'candidate-choice';
      candidates: Inspection[];
    });

export type DeviceUpdateInspectionPlan =
  | { kind: 'apply'; autoAction: 'none' | 'create-new' | 'recalculate-current' | 'detach-current'; currentInspectionId?: string }
  | (InspectionPromptBase & {
      kind: 'single-candidate';
      candidate: Inspection;
      primaryActionLabel: string;
    })
  | (InspectionPromptBase & {
      kind: 'candidate-choice';
      candidates: Inspection[];
    });

@Injectable({ providedIn: 'root' })
export class InspectionDeviceFlowService {
  private readonly customersStore = inject(CustomersStore);
  private readonly inspectionsStore = inject(InspectionsStore);

  previewCreateDevice(
    customerSelection: DeviceCustomerSelection,
    deviceDraft: DeviceDraft,
  ): DeviceCreateInspectionPlan {
    const customerId =
      customerSelection.kind === 'existing' ? customerSelection.customer.id : 'pending-customer';
    const customerName = this.getSelectionCustomerName(customerSelection);
    const devicePreview = createDeviceInspectionSnapshot(customerId, 'pending-device', deviceDraft);

    if (!isDeviceEligibleForInspection(devicePreview)) {
      return { kind: 'save-only' };
    }

    if (customerSelection.kind === 'new') {
      return { kind: 'auto-create' };
    }

    const matches = findMatchingInspections(
      customerSelection.customer.id,
      devicePreview,
      this.inspectionsStore.inspections(),
      this.inspectionsStore.devicesById(),
    ).map((candidate) => candidate.inspection);

    if (!matches.length) {
      return { kind: 'auto-create' };
    }

    if (matches.length === 1) {
      return {
        kind: 'single-candidate',
        title: 'Dołączyć urządzenie do istniejącego przeglądu?',
        description:
          'Nowe urządzenie pasuje do jednego otwartego przeglądu klienta. Możesz je dołączyć albo utworzyć osobny przegląd.',
        customerName,
        deviceName: this.getDeviceName(deviceDraft),
        candidate: matches[0],
        primaryActionLabel: 'Dołącz do przeglądu',
        createActionLabel: 'Osobny przegląd',
        cancelActionLabel: 'Anuluj',
        transition: 'none',
      };
    }

    return {
      kind: 'candidate-choice',
      title: 'Wybierz przegląd dla nowego urządzenia',
      description:
        'Znaleźliśmy kilka otwartych przeglądów tego klienta mieszczących się w oknie 30 dni. Wybierz, do którego przypiąć urządzenie albo utwórz nowy przegląd.',
      customerName,
      deviceName: this.getDeviceName(deviceDraft),
      candidates: matches,
      createActionLabel: 'Utwórz nowy przegląd',
      cancelActionLabel: 'Anuluj',
      transition: 'none',
    };
  }

  commitCreateDevice(
    customerSelection: DeviceCustomerSelection,
    deviceDraft: DeviceDraft,
    plan: DeviceCreateInspectionPlan,
    choice?: InspectionResolutionChoice,
  ): DeviceInspectionTransactionResult | undefined {
    const result =
      customerSelection.kind === 'existing'
        ? this.customersStore.saveDeviceWithCustomer({ customerId: customerSelection.customer.id }, deviceDraft)
        : this.customersStore.saveDeviceWithCustomer({ customerDraft: customerSelection.draft }, deviceDraft);

    if (!result) {
      return undefined;
    }

    if (plan.kind === 'save-only') {
      return {
        customer: result.customer,
        device: result.device,
      };
    }

    if (plan.kind === 'auto-create' || choice?.kind === 'create-new') {
      const inspectionToCreate = this.inspectionsStore.createInspection({
        customerId: result.customer.id,
        deviceIds: [result.device.id],
        source: plan.kind === 'auto-create' ? 'auto' : 'manual',
      });

      return {
        customer: result.customer,
        device: result.device,
        inspectionToCreate,
      };
    }

    if (choice?.kind === 'attach') {
      const inspectionToAttach = this.inspectionsStore.attachDeviceToInspection(
        choice.inspectionId,
        result.device.id,
      );

      return {
        customer: result.customer,
        device: result.device,
        inspectionToAttach,
      };
    }

    return {
      customer: result.customer,
      device: result.device,
    };
  }

  previewUpdateDevice(customer: Customer, device: Device, nextDraft: DeviceDraft): DeviceUpdateInspectionPlan {
    const normalizedNextDate = nextDraft.hasScheduledInspections ? nextDraft.nextInspectionDate.trim() : '';
    const relevantChanged =
      device.hasScheduledInspections !== nextDraft.hasScheduledInspections ||
      device.nextInspectionDate !== normalizedNextDate;

    if (!relevantChanged) {
      return {
        kind: 'apply',
        autoAction: 'none',
      };
    }

    const currentInspection = this.inspectionsStore.getActiveInspectionByDeviceId(device.id);
    const previewDevice = createDeviceInspectionSnapshot(customer.id, device.id, nextDraft);
    const devicesById = new Map(this.inspectionsStore.devicesById());
    devicesById.set(device.id, previewDevice);

    if (!isDeviceEligibleForInspection(previewDevice)) {
      return {
        kind: 'apply',
        autoAction: currentInspection ? 'detach-current' : 'none',
        currentInspectionId: currentInspection?.id,
      };
    }

    if (!currentInspection || !this.isTrackedActiveInspection(currentInspection)) {
      return this.createStandalonePlan(customer, previewDevice, nextDraft);
    }

    const remainingDeviceIds = currentInspection.deviceIds.filter((deviceId) => deviceId !== device.id);

    if (!remainingDeviceIds.length) {
      if (currentInspection.status === 'scheduled') {
        return {
          kind: 'candidate-choice',
          title: 'Zmiana daty utworzy nowy przegląd',
          description:
            'To urządzenie jest jedynym elementem już umówionego przeglądu. Zmiana daty anuluje aktualny przegląd i utworzy nowy obiekt planowania.',
          customerName: this.getCustomerName(customer),
          deviceName: this.getDeviceName(nextDraft),
          candidates: [],
          createActionLabel: 'Anuluj obecny i utwórz nowy przegląd',
          cancelActionLabel: 'Cofnij zmianę daty',
          transition: 'cancel-current',
          currentInspectionId: currentInspection.id,
        };
      }

      return {
        kind: 'apply',
        autoAction: 'recalculate-current',
        currentInspectionId: currentInspection.id,
      };
    }

    if (inspectionCanIncludeDate(currentInspection, previewDevice.nextInspectionDate, devicesById, [device.id])) {
      return {
        kind: 'apply',
        autoAction: 'recalculate-current',
        currentInspectionId: currentInspection.id,
      };
    }

    const matchingInspections = findMatchingInspections(
      customer.id,
      previewDevice,
      this.inspectionsStore.inspections(),
      devicesById,
      [currentInspection.id],
    ).map((candidate) => candidate.inspection);

    const description =
      currentInspection.status === 'scheduled'
        ? 'Nowa data wypada poza 30-dniowym oknem obecnie umówionego przeglądu. Urządzenie trzeba odłączyć od aktualnego przeglądu i przypisać gdzie indziej albo utworzyć nowy.'
        : 'Nowa data wypada poza 30-dniowym oknem aktualnego przeglądu. Wybierz inny otwarty przegląd, utwórz nowy albo cofnij zmianę.';

    if (matchingInspections.length === 1) {
      return {
        kind: 'single-candidate',
        title: 'Przepiąć urządzenie do innego przeglądu?',
        description,
        customerName: this.getCustomerName(customer),
        deviceName: this.getDeviceName(nextDraft),
        candidate: matchingInspections[0],
        primaryActionLabel: 'Przypisz do tego przeglądu',
        createActionLabel: 'Utwórz nowy przegląd',
        cancelActionLabel: 'Cofnij zmianę daty',
        transition: 'detach-current',
        currentInspectionId: currentInspection.id,
      };
    }

    return {
      kind: 'candidate-choice',
      title: 'Wybierz nowy przegląd dla urządzenia',
      description,
      customerName: this.getCustomerName(customer),
      deviceName: this.getDeviceName(nextDraft),
      candidates: matchingInspections,
      createActionLabel: 'Utwórz nowy przegląd',
      cancelActionLabel: 'Cofnij zmianę daty',
      transition: 'detach-current',
      currentInspectionId: currentInspection.id,
    };
  }

  commitUpdateDevice(
    customer: Customer,
    device: Device,
    nextDraft: DeviceDraft,
    plan: DeviceUpdateInspectionPlan,
    choice?: InspectionResolutionChoice,
  ): DeviceInspectionTransactionResult | undefined {
    const updatedDevice = this.customersStore.updateDevice(customer.id, device.id, nextDraft);
    const updatedCustomer = this.customersStore.getCustomerById(customer.id);

    if (!updatedDevice || !updatedCustomer) {
      return undefined;
    }

    let inspectionToCreate: Inspection | undefined;
    let inspectionToAttach: Inspection | undefined;
    let inspectionToDetach: Inspection | undefined;
    let inspectionToDelete: Inspection | undefined;
    let inspectionToCancel: Inspection | undefined;

    if (plan.kind === 'apply') {
      if (plan.autoAction === 'create-new') {
        inspectionToCreate = this.inspectionsStore.createInspection({
          customerId: customer.id,
          deviceIds: [device.id],
          source: 'auto',
        });
      }

      if (plan.autoAction === 'recalculate-current' && plan.currentInspectionId) {
        inspectionToAttach = this.inspectionsStore.recalculateInspection(plan.currentInspectionId);
      }

      if (plan.autoAction === 'detach-current' && plan.currentInspectionId) {
        const detachResult = this.inspectionsStore.removeDeviceFromInspection(
          plan.currentInspectionId,
          device.id,
        );
        inspectionToDetach = detachResult.updatedInspection;
        inspectionToDelete = detachResult.deletedInspection;
      }

      return {
        customer: updatedCustomer,
        device: updatedDevice,
        inspectionToCreate,
        inspectionToAttach,
        inspectionToDetach,
        inspectionToDelete,
      };
    }

    if (plan.transition === 'detach-current' && plan.currentInspectionId) {
      const detachResult = this.inspectionsStore.removeDeviceFromInspection(plan.currentInspectionId, device.id);
      inspectionToDetach = detachResult.updatedInspection;
      inspectionToDelete = detachResult.deletedInspection;
    }

    if (plan.transition === 'cancel-current' && plan.currentInspectionId) {
      inspectionToCancel = this.inspectionsStore.cancelInspection(plan.currentInspectionId);
    }

    if (choice?.kind === 'attach') {
      inspectionToAttach = this.inspectionsStore.attachDeviceToInspection(choice.inspectionId, device.id);
    } else {
      inspectionToCreate = this.inspectionsStore.createInspection({
        customerId: customer.id,
        deviceIds: [device.id],
        source: 'manual',
      });
    }

    return {
      customer: updatedCustomer,
      device: updatedDevice,
      inspectionToCreate,
      inspectionToAttach,
      inspectionToDetach,
      inspectionToDelete,
      inspectionToCancel,
    };
  }

  describeInspection(inspection: Inspection): string {
    return buildInspectionShortDescription({
      status: inspection.status,
      windowStart: inspection.windowStart,
      windowEnd: inspection.windowEnd,
      plannedDate: inspection.plannedDate,
      deviceCount: inspection.deviceIds.length,
    });
  }

  private createStandalonePlan(
    customer: Customer,
    previewDevice: DeviceInspectionLike,
    nextDraft: DeviceDraft,
  ): DeviceUpdateInspectionPlan {
    const matches = findMatchingInspections(
      customer.id,
      previewDevice,
      this.inspectionsStore.inspections(),
      this.inspectionsStore.devicesById(),
    ).map((candidate) => candidate.inspection);

    if (!matches.length) {
      return {
        kind: 'apply',
        autoAction: 'create-new',
      };
    }

    if (matches.length === 1) {
      return {
        kind: 'single-candidate',
        title: 'Dołączyć urządzenie do istniejącego przeglądu?',
        description:
          'Nowa data kwalifikuje to urządzenie do jednego otwartego przeglądu klienta. Możesz je dołączyć albo utworzyć osobny przegląd.',
        customerName: this.getCustomerName(customer),
        deviceName: this.getDeviceName(nextDraft),
        candidate: matches[0],
        primaryActionLabel: 'Dołącz do przeglądu',
        createActionLabel: 'Osobny przegląd',
        cancelActionLabel: 'Cofnij datę',
        transition: 'none',
      };
    }

    return {
      kind: 'candidate-choice',
      title: 'Wybierz przegląd dla urządzenia',
      description:
        'Nowa data pasuje do kilku otwartych przeglądów klienta. Wybierz jeden z nich albo utwórz nowy przegląd.',
      customerName: this.getCustomerName(customer),
      deviceName: this.getDeviceName(nextDraft),
      candidates: matches,
      createActionLabel: 'Utwórz nowy przegląd',
      cancelActionLabel: 'Cofnij zmianę daty',
      transition: 'none',
    };
  }

  private getSelectionCustomerName(selection: DeviceCustomerSelection): string {
    return selection.kind === 'existing'
      ? this.getCustomerName(selection.customer)
      : selection.draft.companyName || selection.draft.fullName || 'Nowy klient';
  }

  private getCustomerName(customer: Customer): string {
    return customer.companyName || customer.fullName || 'Klient';
  }

  private getDeviceName(deviceDraft: Pick<DeviceDraft, 'brand' | 'model'>): string {
    const label = `${deviceDraft.brand} ${deviceDraft.model}`.trim();

    return label || 'Nowe urządzenie';
  }

  private isTrackedActiveInspection(inspection: Inspection): boolean {
    return inspection.status === 'scheduled' || FLEXIBLE_INSPECTION_STATUSES.includes(inspection.status);
  }
}
