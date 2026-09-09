import { Injectable, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { Observable, map, of, switchMap } from 'rxjs';

import {
  CreateDeviceServiceOrderCommandDto,
  CustomerDeviceListItemDto,
  CustomerDto,
  CustomersApi,
  DeviceDto,
  InspectionServiceOrderDto,
  ServiceOrdersApi,
  UpdateDeviceServiceOrderCommandDto,
} from '../../../common/api';
import {
  ServiceOrderCandidate,
  ServiceOrderRelatedDevice,
} from '../../service-orders/models/service-order-candidate.model';
import { DeviceDraft } from '../models/device.model';
import { formatCustomerName } from '../utils/customer-ui.util';
import { toInspectionDateTimeLocalValue } from '../models/device-inspection.model';

export type DeviceFlowChoice = { kind: 'attach'; serviceOrderId: string } | { kind: 'create-new' };

interface DeviceFlowPromptBase {
  title: string;
  description: string;
  customerName: string;
  deviceName: string;
  createActionLabel: string;
  cancelActionLabel: string;
  transition: 'none' | 'change-current-date';
  currentServiceOrderId?: string;
  relatedDevices: ServiceOrderRelatedDevice[];
}

export type ApiDeviceCreatePlan =
  | { kind: 'save-only' }
  | { kind: 'auto-create' }
  | (DeviceFlowPromptBase & {
      kind: 'single-candidate';
      candidate: ServiceOrderCandidate;
      primaryActionLabel: string;
    })
  | (DeviceFlowPromptBase & {
      kind: 'candidate-choice';
      candidates: ServiceOrderCandidate[];
    });

export type ApiDeviceUpdatePlan =
  | { kind: 'apply'; command?: UpdateDeviceServiceOrderCommandDto }
  | (DeviceFlowPromptBase & {
      kind: 'single-candidate';
      candidate: ServiceOrderCandidate;
      primaryActionLabel: string;
    })
  | (DeviceFlowPromptBase & {
      kind: 'candidate-choice';
      candidates: ServiceOrderCandidate[];
    });

@Injectable({ providedIn: 'root' })
export class CustomerDeviceFlowService {
  private readonly customersApi = inject(CustomersApi);
  private readonly serviceOrdersApi = inject(ServiceOrdersApi);
  private readonly transloco = inject(TranslocoService);

  previewCreateDevice(
    customer: CustomerDto,
    devices: readonly CustomerDeviceListItemDto[],
    draft: DeviceDraft,
  ): Observable<ApiDeviceCreatePlan> {
    if (!hasInspectionIntent(draft)) {
      return of({ kind: 'save-only' });
    }

    return this.loadCandidates(customer, devices).pipe(
      map((candidates) => this.createCreatePlan(customer, draft, devices, candidates)),
    );
  }

  previewUpdateDevice(
    customer: CustomerDto,
    devices: readonly CustomerDeviceListItemDto[],
    device: DeviceDto,
    activeInspection: InspectionServiceOrderDto | null,
    draft: DeviceDraft,
  ): Observable<ApiDeviceUpdatePlan> {
    const immediatePlan = this.createImmediateUpdatePlan(activeInspection, draft);

    if (immediatePlan !== null) {
      return of(immediatePlan);
    }

    return this.previewContextualUpdate(customer, devices, device, activeInspection, draft);
  }

  previewUpdateDeviceForCustomer(
    customerId: string,
    device: DeviceDto,
    activeInspection: InspectionServiceOrderDto | null,
    draft: DeviceDraft,
  ): Observable<ApiDeviceUpdatePlan> {
    const immediatePlan = this.createImmediateUpdatePlan(activeInspection, draft);

    if (immediatePlan !== null) {
      return of(immediatePlan);
    }

    return this.customersApi
      .getCustomerDetails(customerId)
      .pipe(
        switchMap(({ data }) =>
          this.previewContextualUpdate(
            data.customer,
            data.devices,
            device,
            activeInspection,
            draft,
          ),
        ),
      );
  }

  private createImmediateUpdatePlan(
    activeInspection: InspectionServiceOrderDto | null,
    draft: DeviceDraft,
  ): ApiDeviceUpdatePlan | null {
    const wantsInspection = hasInspectionIntent(draft);
    const nextInspectionDate = inspectionDateFromDraft(draft);
    const currentInspectionDate = toInspectionDateTimeLocalValue(
      activeInspection?.scheduledAt ?? '',
    );

    if (!activeInspection && !wantsInspection) {
      return { kind: 'apply' };
    }

    if (activeInspection && !wantsInspection) {
      return {
        kind: 'apply',
        command: {
          action: 'detach_inspection',
          serviceOrderId: activeInspection.id,
        },
      };
    }

    if (activeInspection && currentInspectionDate === nextInspectionDate) {
      return { kind: 'apply' };
    }

    return null;
  }

  private previewContextualUpdate(
    customer: CustomerDto,
    devices: readonly CustomerDeviceListItemDto[],
    device: DeviceDto,
    activeInspection: InspectionServiceOrderDto | null,
    draft: DeviceDraft,
  ): Observable<ApiDeviceUpdatePlan> {
    if (activeInspection) {
      return of(this.createReschedulePlan(customer, devices, device, activeInspection, draft));
    }

    return this.loadCandidates(customer, devices, device.id).pipe(
      map((candidates) => this.createUpdateAttachPlan(customer, draft, devices, candidates)),
    );
  }

  resolveCreateCommand(
    plan: ApiDeviceCreatePlan,
    draft: DeviceDraft,
    choice?: DeviceFlowChoice,
  ): CreateDeviceServiceOrderCommandDto | undefined {
    if (plan.kind === 'save-only') {
      return undefined;
    }

    if (choice?.kind === 'attach') {
      return { action: 'attach_inspection', serviceOrderId: choice.serviceOrderId };
    }

    return { action: 'create_inspection', scheduledAt: inspectionDateFromDraft(draft) };
  }

  resolveUpdateCommand(
    plan: ApiDeviceUpdatePlan,
    draft: DeviceDraft,
    choice?: DeviceFlowChoice,
  ): UpdateDeviceServiceOrderCommandDto | undefined {
    if (plan.kind === 'apply') {
      return plan.command;
    }

    if (plan.transition === 'change-current-date' && plan.currentServiceOrderId) {
      return choice?.kind === 'attach'
        ? {
            action: 'reschedule_inspection',
            currentServiceOrderId: plan.currentServiceOrderId,
            scheduledAt: inspectionDateFromDraft(draft),
          }
        : {
            action: 'move_to_new_inspection',
            currentServiceOrderId: plan.currentServiceOrderId,
            scheduledAt: inspectionDateFromDraft(draft),
          };
    }

    return choice?.kind === 'attach'
      ? { action: 'attach_inspection', serviceOrderId: choice.serviceOrderId }
      : { action: 'create_inspection', scheduledAt: inspectionDateFromDraft(draft) };
  }

  private loadCandidates(
    customer: CustomerDto,
    devices: readonly CustomerDeviceListItemDto[],
    excludeDeviceId?: string,
  ): Observable<ServiceOrderCandidate[]> {
    return this.serviceOrdersApi
      .listServiceOrders({
        customerId: customer.id,
        type: 'inspection',
        active: true,
        excludeDeviceId,
      })
      .pipe(map(({ data }) => data.map((order) => toCandidate(order, devices))));
  }

  private createCreatePlan(
    customer: CustomerDto,
    draft: DeviceDraft,
    devices: readonly CustomerDeviceListItemDto[],
    candidates: ServiceOrderCandidate[],
  ): ApiDeviceCreatePlan {
    if (!candidates.length) {
      return { kind: 'auto-create' };
    }

    return this.createAttachPrompt(customer, draft, devices, candidates, 'create');
  }

  private createUpdateAttachPlan(
    customer: CustomerDto,
    draft: DeviceDraft,
    devices: readonly CustomerDeviceListItemDto[],
    candidates: ServiceOrderCandidate[],
  ): ApiDeviceUpdatePlan {
    if (!candidates.length) {
      return {
        kind: 'apply',
        command: {
          action: 'create_inspection',
          scheduledAt: inspectionDateFromDraft(draft),
        },
      };
    }

    return this.createAttachPrompt(customer, draft, devices, candidates, 'update');
  }

  private createAttachPrompt(
    customer: CustomerDto,
    draft: DeviceDraft,
    devices: readonly CustomerDeviceListItemDto[],
    candidates: ServiceOrderCandidate[],
    mode: 'create' | 'update',
  ):
    | Extract<ApiDeviceCreatePlan | ApiDeviceUpdatePlan, { kind: 'single-candidate' }>
    | Extract<ApiDeviceCreatePlan | ApiDeviceUpdatePlan, { kind: 'candidate-choice' }> {
    const base = this.createPromptBase(customer, draft, [], 'none');

    if (candidates.length === 1) {
      const candidate = candidates[0];

      return {
        ...base,
        kind: 'single-candidate',
        title: this.transloco.translate('serviceOrders.deviceFlow.attachExistingTitle'),
        description: this.transloco.translate(
          mode === 'create'
            ? 'serviceOrders.deviceFlow.newDeviceSingleDescription'
            : 'serviceOrders.deviceFlow.newDateSingleDescription',
        ),
        candidate,
        relatedDevices: relatedDevicesForOrder(customer, devices, candidate.id),
        primaryActionLabel: this.transloco.translate('serviceOrders.deviceFlow.attachToInspection'),
        createActionLabel: this.transloco.translate('serviceOrders.deviceFlow.separateInspection'),
      };
    }

    return {
      ...base,
      kind: 'candidate-choice',
      title: this.transloco.translate(
        mode === 'create'
          ? 'serviceOrders.deviceFlow.newDeviceChoiceTitle'
          : 'serviceOrders.deviceFlow.newDateChoiceTitle',
      ),
      description: this.transloco.translate(
        mode === 'create'
          ? 'serviceOrders.deviceFlow.newDeviceChoiceDescription'
          : 'serviceOrders.deviceFlow.newDateChoiceDescription',
      ),
      candidates,
      createActionLabel: this.transloco.translate('serviceOrders.deviceFlow.createNewInspection'),
    };
  }

  private createReschedulePlan(
    customer: CustomerDto,
    devices: readonly CustomerDeviceListItemDto[],
    device: DeviceDto,
    activeInspection: InspectionServiceOrderDto,
    draft: DeviceDraft,
  ): ApiDeviceUpdatePlan {
    const relatedDevices = relatedDevicesForOrder(
      customer,
      devices,
      activeInspection.id,
      device.id,
    );

    if (!relatedDevices.length) {
      return {
        kind: 'apply',
        command: {
          action: 'reschedule_inspection',
          currentServiceOrderId: activeInspection.id,
          scheduledAt: inspectionDateFromDraft(draft),
        },
      };
    }

    return {
      ...this.createPromptBase(customer, draft, relatedDevices, 'change-current-date'),
      kind: 'single-candidate',
      title: this.transloco.translate('serviceOrders.deviceFlow.changeSharedInspectionTitle'),
      description: this.transloco.translate(
        'serviceOrders.deviceFlow.changeSharedInspectionDescription',
      ),
      candidate: toCandidate(activeInspection, devices),
      primaryActionLabel: this.transloco.translate(
        'serviceOrders.deviceFlow.changeSharedInspectionDate',
      ),
      createActionLabel: this.transloco.translate(
        'serviceOrders.deviceFlow.createSeparateWithNewDate',
      ),
      cancelActionLabel: this.transloco.translate('serviceOrders.deviceFlow.undoDateChange'),
      currentServiceOrderId: activeInspection.id,
    };
  }

  private createPromptBase(
    customer: CustomerDto,
    draft: DeviceDraft,
    relatedDevices: ServiceOrderRelatedDevice[],
    transition: DeviceFlowPromptBase['transition'],
  ): DeviceFlowPromptBase {
    return {
      title: '',
      description: '',
      customerName: formatCustomerName(customer),
      deviceName: `${draft.brand} ${draft.model}`.trim(),
      createActionLabel: '',
      cancelActionLabel: this.transloco.translate('common.actions.cancel'),
      transition,
      relatedDevices,
    };
  }
}

function hasInspectionIntent(
  draft: Pick<DeviceDraft, 'hasScheduledInspections' | 'nextInspectionDate'>,
): boolean {
  return draft.hasScheduledInspections && Boolean(draft.nextInspectionDate.trim());
}

function inspectionDateFromDraft(
  draft: Pick<DeviceDraft, 'hasScheduledInspections' | 'nextInspectionDate'>,
): string {
  return draft.hasScheduledInspections ? draft.nextInspectionDate.trim() : '';
}

function toCandidate(
  order: InspectionServiceOrderDto,
  devices: readonly CustomerDeviceListItemDto[],
): ServiceOrderCandidate {
  return {
    id: order.id,
    status: order.status,
    scheduledAt: order.scheduledAt,
    orderDate: order.orderDate,
    deviceCount: devices.filter((device) => device.activeInspection?.id === order.id).length,
  };
}

function relatedDevicesForOrder(
  customer: CustomerDto,
  devices: readonly CustomerDeviceListItemDto[],
  serviceOrderId: string,
  excludedDeviceId = '',
): ServiceOrderRelatedDevice[] {
  return devices
    .filter(
      (device) => device.id !== excludedDeviceId && device.activeInspection?.id === serviceOrderId,
    )
    .map((device) => ({
      id: device.id,
      brand: device.brand,
      model: device.model,
      address: formatDeviceAddress(customer, device),
    }));
}

function formatDeviceAddress(customer: CustomerDto, device: CustomerDeviceListItemDto): string {
  const address = device.hasCustomInstallationAddress ? device.address : customer.address;
  const postalCode = device.hasCustomInstallationAddress ? device.postalCode : customer.postalCode;
  const city = device.hasCustomInstallationAddress ? device.city : customer.city;

  return [address, `${postalCode} ${city}`.trim()].filter(Boolean).join(', ');
}
