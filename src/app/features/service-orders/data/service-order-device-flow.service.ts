import { Injectable, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

import { CustomersStore } from '../../customers/data/customers.store';
import { Customer, CustomerDraft } from '../../customers/models/customer.model';
import { Device, DeviceDraft } from '../../customers/models/device.model';
import { ServiceOrder } from '../models/service-order.model';
import { ServiceOrdersStore } from './service-orders.store';

export type DeviceCustomerSelection =
  | { kind: 'existing'; customer: Customer }
  | { kind: 'new'; draft: CustomerDraft };

export type ServiceOrderResolutionChoice =
  | { kind: 'attach'; serviceOrderId: string }
  | { kind: 'create-new' };

export interface DeviceServiceOrderTransactionResult {
  customer: Customer;
  device: Device;
  orderToCreate?: ServiceOrder;
  orderToAttach?: ServiceOrder;
  orderToDetach?: ServiceOrder;
  orderToDelete?: ServiceOrder;
  orderToUpdate?: ServiceOrder;
}

interface ServiceOrderPromptBase {
  title: string;
  description: string;
  customerName: string;
  deviceName: string;
  createActionLabel: string;
  cancelActionLabel: string;
  transition: 'none' | 'detach-current' | 'change-current-date';
  currentServiceOrderId?: string;
}

export type DeviceCreateServiceOrderPlan =
  | { kind: 'save-only' }
  | { kind: 'auto-create' }
  | (ServiceOrderPromptBase & {
      kind: 'single-candidate';
      candidate: ServiceOrder;
      primaryActionLabel: string;
    })
  | (ServiceOrderPromptBase & {
      kind: 'candidate-choice';
      candidates: ServiceOrder[];
    });

export type DeviceUpdateServiceOrderPlan =
  | {
      kind: 'apply';
      autoAction: 'none' | 'create-new' | 'change-current-date' | 'detach-current';
      currentServiceOrderId?: string;
    }
  | (ServiceOrderPromptBase & {
      kind: 'single-candidate';
      candidate: ServiceOrder;
      primaryActionLabel: string;
    })
  | (ServiceOrderPromptBase & {
      kind: 'candidate-choice';
      candidates: ServiceOrder[];
    });

@Injectable({ providedIn: 'root' })
export class ServiceOrderDeviceFlowService {
  private readonly customersStore = inject(CustomersStore);
  private readonly serviceOrdersStore = inject(ServiceOrdersStore);
  private readonly transloco = inject(TranslocoService);

  previewCreateDevice(
    customerSelection: DeviceCustomerSelection,
    deviceDraft: DeviceDraft,
  ): DeviceCreateServiceOrderPlan {
    if (!this.hasInspectionIntent(deviceDraft)) {
      return { kind: 'save-only' };
    }

    if (customerSelection.kind === 'new') {
      return { kind: 'auto-create' };
    }

    const matches = this.serviceOrdersStore.getActiveInspectionOrdersByCustomerId(
      customerSelection.customer.id,
    );

    return this.createCreateAttachPrompt(
      matches,
      this.getCustomerName(customerSelection.customer),
      this.getDeviceName(deviceDraft),
    );
  }

  commitCreateDevice(
    customerSelection: DeviceCustomerSelection,
    deviceDraft: DeviceDraft,
    plan: DeviceCreateServiceOrderPlan,
    choice?: ServiceOrderResolutionChoice,
  ): DeviceServiceOrderTransactionResult | undefined {
    const result =
      customerSelection.kind === 'existing'
        ? this.customersStore.saveDeviceWithCustomer(
            { customerId: customerSelection.customer.id },
            deviceDraft,
          )
        : this.customersStore.saveDeviceWithCustomer(
            { customerDraft: customerSelection.draft },
            deviceDraft,
          );

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
      const orderToAttach = this.serviceOrdersStore.attachDeviceToInspectionOrder(
        choice.serviceOrderId,
        result.device.id,
      );

      return {
        customer: result.customer,
        device: result.device,
        orderToAttach,
      };
    }

    const orderToCreate = this.serviceOrdersStore.createInspectionOrder({
      customerId: result.customer.id,
      deviceIds: [result.device.id],
      scheduledAt: this.inspectionDateFromDraft(deviceDraft),
    });

    return {
      customer: result.customer,
      device: result.device,
      orderToCreate,
    };
  }

  previewUpdateDevice(
    customer: Customer,
    device: Device,
    nextDraft: DeviceDraft,
  ): DeviceUpdateServiceOrderPlan {
    const currentInspection = this.serviceOrdersStore.getActiveInspectionOrderByDeviceId(device.id);
    const wantsInspection = this.hasInspectionIntent(nextDraft);
    const nextInspectionDate = this.inspectionDateFromDraft(nextDraft);
    const currentInspectionDate = currentInspection?.scheduledAt ?? '';
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
        currentServiceOrderId: currentInspection?.id,
      };
    }

    if (!currentInspection || !isOpenOrder(currentInspection)) {
      const matches = this.serviceOrdersStore.getActiveInspectionOrdersByCustomerId(
        customer.id,
        device.id,
      );

      return this.createUpdateAttachPrompt(
        matches,
        this.getCustomerName(customer),
        this.getDeviceName(nextDraft),
      );
    }

    if (
      currentInspection.serviceData.type === 'inspection' &&
      currentInspection.serviceData.deviceIds.length <= 1
    ) {
      return {
        kind: 'apply',
        autoAction: 'change-current-date',
        currentServiceOrderId: currentInspection.id,
      };
    }

    return {
      kind: 'single-candidate',
      title: this.transloco.translate('serviceOrders.deviceFlow.changeSharedInspectionTitle'),
      description: this.transloco.translate(
        'serviceOrders.deviceFlow.changeSharedInspectionDescription',
      ),
      customerName: this.getCustomerName(customer),
      deviceName: this.getDeviceName(nextDraft),
      candidate: currentInspection,
      primaryActionLabel: this.transloco.translate(
        'serviceOrders.deviceFlow.changeSharedInspectionDate',
      ),
      createActionLabel: this.transloco.translate(
        'serviceOrders.deviceFlow.createSeparateWithNewDate',
      ),
      cancelActionLabel: this.transloco.translate('serviceOrders.deviceFlow.undoDateChange'),
      transition: 'change-current-date',
      currentServiceOrderId: currentInspection.id,
    };
  }

  commitUpdateDevice(
    customer: Customer,
    device: Device,
    nextDraft: DeviceDraft,
    plan: DeviceUpdateServiceOrderPlan,
    choice?: ServiceOrderResolutionChoice,
  ): DeviceServiceOrderTransactionResult | undefined {
    const updatedDevice = this.customersStore.updateDevice(customer.id, device.id, nextDraft);
    const updatedCustomer = this.customersStore.getCustomerById(customer.id);

    if (!updatedDevice || !updatedCustomer) {
      return undefined;
    }

    let orderToCreate: ServiceOrder | undefined;
    let orderToAttach: ServiceOrder | undefined;
    let orderToDetach: ServiceOrder | undefined;
    let orderToDelete: ServiceOrder | undefined;
    let orderToUpdate: ServiceOrder | undefined;

    if (plan.kind === 'apply') {
      if (plan.autoAction === 'create-new') {
        orderToCreate = this.serviceOrdersStore.createInspectionOrder({
          customerId: customer.id,
          deviceIds: [device.id],
          scheduledAt: this.inspectionDateFromDraft(nextDraft),
        });
      }

      if (plan.autoAction === 'change-current-date' && plan.currentServiceOrderId) {
        orderToUpdate = this.serviceOrdersStore.updateInspectionDate(
          plan.currentServiceOrderId,
          this.inspectionDateFromDraft(nextDraft),
        );
      }

      if (plan.autoAction === 'detach-current' && plan.currentServiceOrderId) {
        const detachResult = this.serviceOrdersStore.removeDeviceFromInspectionOrder(
          plan.currentServiceOrderId,
          device.id,
        );
        orderToDetach = detachResult.updatedOrder;
        orderToDelete = detachResult.deletedOrder;
      }

      return {
        customer: updatedCustomer,
        device: updatedDevice,
        orderToCreate,
        orderToDetach,
        orderToDelete,
        orderToUpdate,
      };
    }

    if (plan.transition === 'change-current-date' && plan.currentServiceOrderId) {
      if (choice?.kind === 'attach') {
        orderToUpdate = this.serviceOrdersStore.updateInspectionDate(
          plan.currentServiceOrderId,
          this.inspectionDateFromDraft(nextDraft),
        );
      } else {
        orderToCreate = this.serviceOrdersStore.moveDeviceToNewInspectionOrder(
          customer.id,
          plan.currentServiceOrderId,
          device.id,
          this.inspectionDateFromDraft(nextDraft),
        );
      }

      return {
        customer: updatedCustomer,
        device: updatedDevice,
        orderToCreate,
        orderToUpdate,
      };
    }

    if (plan.transition === 'detach-current' && plan.currentServiceOrderId) {
      const detachResult = this.serviceOrdersStore.removeDeviceFromInspectionOrder(
        plan.currentServiceOrderId,
        device.id,
      );
      orderToDetach = detachResult.updatedOrder;
      orderToDelete = detachResult.deletedOrder;
    }

    if (choice?.kind === 'attach') {
      orderToAttach = this.serviceOrdersStore.attachDeviceToInspectionOrder(
        choice.serviceOrderId,
        device.id,
      );
    } else {
      orderToCreate = this.serviceOrdersStore.createInspectionOrder({
        customerId: customer.id,
        deviceIds: [device.id],
        scheduledAt: this.inspectionDateFromDraft(nextDraft),
      });
    }

    return {
      customer: updatedCustomer,
      device: updatedDevice,
      orderToCreate,
      orderToAttach,
      orderToDetach,
      orderToDelete,
    };
  }

  describeInspection(order: ServiceOrder): string {
    const deviceCount =
      order.serviceData.type === 'inspection' ? order.serviceData.deviceIds.length : 0;

    return this.transloco.translate('serviceOrders.deviceFlow.shortDescription', {
      date: order.scheduledAt || '--',
      deviceCount,
    });
  }

  private createCreateAttachPrompt(
    matches: ServiceOrder[],
    customerName: string,
    deviceName: string,
  ): DeviceCreateServiceOrderPlan {
    if (!matches.length) {
      return {
        kind: 'auto-create',
      };
    }

    if (matches.length === 1) {
      return {
        kind: 'single-candidate',
        title: this.transloco.translate('serviceOrders.deviceFlow.attachExistingTitle'),
        description: this.transloco.translate(
          'serviceOrders.deviceFlow.newDeviceSingleDescription',
        ),
        customerName,
        deviceName,
        candidate: matches[0],
        primaryActionLabel: this.transloco.translate('serviceOrders.deviceFlow.attachToInspection'),
        createActionLabel: this.transloco.translate('serviceOrders.deviceFlow.separateInspection'),
        cancelActionLabel: this.transloco.translate('common.actions.cancel'),
        transition: 'none',
      };
    }

    return {
      kind: 'candidate-choice',
      title: this.transloco.translate('serviceOrders.deviceFlow.newDeviceChoiceTitle'),
      description: this.transloco.translate('serviceOrders.deviceFlow.newDeviceChoiceDescription'),
      customerName,
      deviceName,
      candidates: matches,
      createActionLabel: this.transloco.translate('serviceOrders.deviceFlow.createNewInspection'),
      cancelActionLabel: this.transloco.translate('common.actions.cancel'),
      transition: 'none',
    };
  }

  private createUpdateAttachPrompt(
    matches: ServiceOrder[],
    customerName: string,
    deviceName: string,
  ): DeviceUpdateServiceOrderPlan {
    if (!matches.length) {
      return {
        kind: 'apply',
        autoAction: 'create-new',
      };
    }

    if (matches.length === 1) {
      return {
        kind: 'single-candidate',
        title: this.transloco.translate('serviceOrders.deviceFlow.attachExistingTitle'),
        description: this.transloco.translate('serviceOrders.deviceFlow.newDateSingleDescription'),
        customerName,
        deviceName,
        candidate: matches[0],
        primaryActionLabel: this.transloco.translate('serviceOrders.deviceFlow.attachToInspection'),
        createActionLabel: this.transloco.translate('serviceOrders.deviceFlow.separateInspection'),
        cancelActionLabel: this.transloco.translate('common.actions.cancel'),
        transition: 'none',
      };
    }

    return {
      kind: 'candidate-choice',
      title: this.transloco.translate('serviceOrders.deviceFlow.newDateChoiceTitle'),
      description: this.transloco.translate('serviceOrders.deviceFlow.newDateChoiceDescription'),
      customerName,
      deviceName,
      candidates: matches,
      createActionLabel: this.transloco.translate('serviceOrders.deviceFlow.createNewInspection'),
      cancelActionLabel: this.transloco.translate('common.actions.cancel'),
      transition: 'none',
    };
  }

  private getCustomerName(customer: Customer): string {
    return (
      customer.companyName ||
      customer.fullName ||
      this.transloco.translate('customers.fallbackName')
    );
  }

  private getDeviceName(deviceDraft: Pick<DeviceDraft, 'brand' | 'model'>): string {
    const label = `${deviceDraft.brand} ${deviceDraft.model}`.trim();

    return label || this.transloco.translate('visits.create.newDevice');
  }

  private hasInspectionIntent(
    deviceDraft: Pick<DeviceDraft, 'hasScheduledInspections' | 'nextInspectionDate'>,
  ): boolean {
    return deviceDraft.hasScheduledInspections && Boolean(deviceDraft.nextInspectionDate.trim());
  }

  private inspectionDateFromDraft(
    deviceDraft: Pick<DeviceDraft, 'hasScheduledInspections' | 'nextInspectionDate'>,
  ): string {
    return deviceDraft.hasScheduledInspections ? deviceDraft.nextInspectionDate.trim() : '';
  }
}

function isOpenOrder(order: ServiceOrder): boolean {
  return order.status !== 'completed' && order.status !== 'cancelled';
}
