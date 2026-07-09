import { Injectable, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

import { CustomersStore } from '../../customers/data/customers.store';
import { Customer, CustomerDraft } from '../../customers/models/customer.model';
import { Device, DeviceDraft } from '../../customers/models/device.model';
import { Inspection } from '../models/inspection.model';
import { isInspectionOpen } from '../utils/inspection-domain.util';
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
  inspectionToUpdate?: Inspection;
}

interface InspectionPromptBase {
  title: string;
  description: string;
  customerName: string;
  deviceName: string;
  createActionLabel: string;
  cancelActionLabel: string;
  transition: 'none' | 'detach-current' | 'change-current-date';
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
  | {
      kind: 'apply';
      autoAction: 'none' | 'create-new' | 'change-current-date' | 'detach-current';
      currentInspectionId?: string;
    }
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
  private readonly transloco = inject(TranslocoService);

  previewCreateDevice(
    customerSelection: DeviceCustomerSelection,
    deviceDraft: DeviceDraft,
  ): DeviceCreateInspectionPlan {
    if (!this.hasInspectionIntent(deviceDraft)) {
      return { kind: 'save-only' };
    }

    if (customerSelection.kind === 'new') {
      return { kind: 'auto-create' };
    }

    const matches = this.inspectionsStore.getActiveInspectionsByCustomerId(customerSelection.customer.id);

    return this.createCreateAttachPrompt(
      matches,
      this.getCustomerName(customerSelection.customer),
      this.getDeviceName(deviceDraft),
    );
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

    const inspectionToCreate = this.inspectionsStore.createInspection({
      customerId: result.customer.id,
      deviceIds: [result.device.id],
      inspectionDate: this.inspectionDateFromDraft(deviceDraft),
      source: plan.kind === 'auto-create' ? 'auto' : 'manual',
    });

    return {
      customer: result.customer,
      device: result.device,
      inspectionToCreate,
    };
  }

  previewUpdateDevice(customer: Customer, device: Device, nextDraft: DeviceDraft): DeviceUpdateInspectionPlan {
    const currentInspection = this.inspectionsStore.getActiveInspectionByDeviceId(device.id);
    const wantsInspection = this.hasInspectionIntent(nextDraft);
    const nextInspectionDate = this.inspectionDateFromDraft(nextDraft);
    const currentInspectionDate = currentInspection?.inspectionDate ?? '';
    const inspectionChanged =
      Boolean(currentInspection) !== wantsInspection ||
      (wantsInspection && currentInspectionDate !== nextInspectionDate);

    if (!inspectionChanged) {
      return {
        kind: 'apply',
        autoAction: 'none',
      };
    }

    if (!wantsInspection) {
      return {
        kind: 'apply',
        autoAction: currentInspection ? 'detach-current' : 'none',
        currentInspectionId: currentInspection?.id,
      };
    }

    if (!currentInspection || !isInspectionOpen(currentInspection.status)) {
      const matches = this.inspectionsStore.getActiveInspectionsByCustomerId(customer.id, device.id);

      return this.createUpdateAttachPrompt(
        matches,
        this.getCustomerName(customer),
        this.getDeviceName(nextDraft),
      );
    }

    if (currentInspection.deviceIds.length <= 1) {
      return {
        kind: 'apply',
        autoAction: 'change-current-date',
        currentInspectionId: currentInspection.id,
      };
    }

    return {
      kind: 'single-candidate',
      title: this.transloco.translate('inspections.flow.changeSharedInspectionTitle'),
      description: this.transloco.translate('inspections.flow.changeSharedInspectionDescription'),
      customerName: this.getCustomerName(customer),
      deviceName: this.getDeviceName(nextDraft),
      candidate: currentInspection,
      primaryActionLabel: this.transloco.translate('inspections.flow.changeSharedInspectionDate'),
      createActionLabel: this.transloco.translate('inspections.flow.createSeparateWithNewDate'),
      cancelActionLabel: this.transloco.translate('inspections.flow.undoDateChange'),
      transition: 'change-current-date',
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
    let inspectionToUpdate: Inspection | undefined;

    if (plan.kind === 'apply') {
      if (plan.autoAction === 'create-new') {
        inspectionToCreate = this.inspectionsStore.createInspection({
          customerId: customer.id,
          deviceIds: [device.id],
          inspectionDate: this.inspectionDateFromDraft(nextDraft),
          source: 'auto',
        });
      }

      if (plan.autoAction === 'change-current-date' && plan.currentInspectionId) {
        inspectionToUpdate = this.inspectionsStore.setInspectionDate(
          plan.currentInspectionId,
          this.inspectionDateFromDraft(nextDraft),
        );
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
        inspectionToDetach,
        inspectionToDelete,
        inspectionToUpdate,
      };
    }

    if (plan.transition === 'change-current-date' && plan.currentInspectionId) {
      if (choice?.kind === 'attach') {
        inspectionToUpdate = this.inspectionsStore.setInspectionDate(
          plan.currentInspectionId,
          this.inspectionDateFromDraft(nextDraft),
        );
      } else {
        inspectionToCreate = this.inspectionsStore.moveDeviceToNewInspection(
          customer.id,
          plan.currentInspectionId,
          device.id,
          this.inspectionDateFromDraft(nextDraft),
        );
      }

      return {
        customer: updatedCustomer,
        device: updatedDevice,
        inspectionToCreate,
        inspectionToUpdate,
      };
    }

    if (plan.transition === 'detach-current' && plan.currentInspectionId) {
      const detachResult = this.inspectionsStore.removeDeviceFromInspection(plan.currentInspectionId, device.id);
      inspectionToDetach = detachResult.updatedInspection;
      inspectionToDelete = detachResult.deletedInspection;
    }

    if (choice?.kind === 'attach') {
      inspectionToAttach = this.inspectionsStore.attachDeviceToInspection(choice.inspectionId, device.id);
    } else {
      inspectionToCreate = this.inspectionsStore.createInspection({
        customerId: customer.id,
        deviceIds: [device.id],
        inspectionDate: this.inspectionDateFromDraft(nextDraft),
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
    };
  }

  describeInspection(inspection: Inspection): string {
    return buildInspectionShortDescription(
      {
        status: inspection.status,
        inspectionDate: inspection.inspectionDate,
        deviceCount: inspection.deviceIds.length,
      },
      this.transloco,
    );
  }

  private createCreateAttachPrompt(
    matches: Inspection[],
    customerName: string,
    deviceName: string,
  ): DeviceCreateInspectionPlan {
    if (!matches.length) {
      return {
        kind: 'auto-create',
      };
    }

    if (matches.length === 1) {
      return {
        kind: 'single-candidate',
        title: this.transloco.translate('inspections.flow.attachExistingTitle'),
        description: this.transloco.translate('inspections.flow.newDeviceSingleDescription'),
        customerName,
        deviceName,
        candidate: matches[0],
        primaryActionLabel: this.transloco.translate('inspections.flow.attachToInspection'),
        createActionLabel: this.transloco.translate('inspections.flow.separateInspection'),
        cancelActionLabel: this.transloco.translate('common.actions.cancel'),
        transition: 'none',
      };
    }

    return {
      kind: 'candidate-choice',
      title: this.transloco.translate('inspections.flow.newDeviceChoiceTitle'),
      description: this.transloco.translate('inspections.flow.newDeviceChoiceDescription'),
      customerName,
      deviceName,
      candidates: matches,
      createActionLabel: this.transloco.translate('inspections.flow.createNewInspection'),
      cancelActionLabel: this.transloco.translate('common.actions.cancel'),
      transition: 'none',
    };
  }

  private createUpdateAttachPrompt(
    matches: Inspection[],
    customerName: string,
    deviceName: string,
  ): DeviceUpdateInspectionPlan {
    if (!matches.length) {
      return {
        kind: 'apply',
        autoAction: 'create-new',
      };
    }

    if (matches.length === 1) {
      return {
        kind: 'single-candidate',
        title: this.transloco.translate('inspections.flow.attachExistingTitle'),
        description: this.transloco.translate('inspections.flow.newDateSingleDescription'),
        customerName,
        deviceName,
        candidate: matches[0],
        primaryActionLabel: this.transloco.translate('inspections.flow.attachToInspection'),
        createActionLabel: this.transloco.translate('inspections.flow.separateInspection'),
        cancelActionLabel: this.transloco.translate('common.actions.cancel'),
        transition: 'none',
      };
    }

    return {
      kind: 'candidate-choice',
      title: this.transloco.translate('inspections.flow.newDateChoiceTitle'),
      description: this.transloco.translate('inspections.flow.newDateChoiceDescription'),
      customerName,
      deviceName,
      candidates: matches,
      createActionLabel: this.transloco.translate('inspections.flow.createNewInspection'),
      cancelActionLabel: this.transloco.translate('common.actions.cancel'),
      transition: 'none',
    };
  }

  private getCustomerName(customer: Customer): string {
    return customer.companyName || customer.fullName || this.transloco.translate('customers.fallbackName');
  }

  private getDeviceName(deviceDraft: Pick<DeviceDraft, 'brand' | 'model'>): string {
    const label = `${deviceDraft.brand} ${deviceDraft.model}`.trim();

    return label || this.transloco.translate('visits.create.newDevice');
  }

  private hasInspectionIntent(deviceDraft: Pick<DeviceDraft, 'hasScheduledInspections' | 'nextInspectionDate'>): boolean {
    return deviceDraft.hasScheduledInspections && Boolean(deviceDraft.nextInspectionDate.trim());
  }

  private inspectionDateFromDraft(deviceDraft: Pick<DeviceDraft, 'hasScheduledInspections' | 'nextInspectionDate'>): string {
    return deviceDraft.hasScheduledInspections ? deviceDraft.nextInspectionDate.trim() : '';
  }
}
