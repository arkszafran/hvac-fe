import { Injectable, computed, inject, signal } from '@angular/core';

import { CustomersStore } from '../../customers/data/customers.store';
import { Customer } from '../../customers/models/customer.model';
import { Device } from '../../customers/models/device.model';
import { SERVICE_ORDER_MOCK_DATA } from './service-order.mock';
import {
  CustomerConfirmationStatus,
  ServiceOrder,
  ServiceOrderAssignee,
  ServiceOrderCustomer,
  ServiceOrderDevice,
  ServiceOrderNote,
  ServiceOrderStatus,
} from '../models/service-order.model';

export interface ServiceOrderDetails {
  order: ServiceOrder;
  systemCustomer?: Customer;
  systemDevices: Device[];
  notes: ServiceOrderNote[];
}

export interface RemoveDeviceFromInspectionOrderResult {
  updatedOrder?: ServiceOrder;
  deletedOrder?: ServiceOrder;
  cancelledOrder?: ServiceOrder;
}

const OPEN_ORDER_STATUSES: readonly ServiceOrderStatus[] = ['new', 'contact_required', 'scheduled'];

@Injectable({ providedIn: 'root' })
export class ServiceOrdersStore {
  private readonly customersStore = inject(CustomersStore);
  private readonly ordersState = signal<ServiceOrder[]>(this.createInitialOrders());
  private readonly notesState = signal<ServiceOrderNote[]>(createInitialNotes());

  readonly orders = this.ordersState.asReadonly();
  readonly notes = this.notesState.asReadonly();

  readonly orderDetails = computed<ServiceOrderDetails[]>(() =>
    this.orders()
      .map((order) => {
        const systemCustomer = order.customerId
          ? this.customersStore.getCustomerById(order.customerId)
          : undefined;
        const deviceIds =
          order.serviceData.type === 'inspection' ? order.serviceData.deviceIds : [];
        const systemDevices = systemCustomer
          ? deviceIds
              .map((deviceId) => systemCustomer.devices.find((device) => device.id === deviceId))
              .filter((device): device is Device => Boolean(device))
          : [];

        return {
          order,
          systemCustomer,
          systemDevices,
          notes: this.notes()
            .filter((note) => note.serviceOrderId === order.id)
            .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
        };
      })
      .sort((left, right) => {
        const leftDate = left.order.scheduledAt || left.order.orderDate;
        const rightDate = right.order.scheduledAt || right.order.orderDate;

        return leftDate.localeCompare(rightDate);
      }),
  );

  getOrderById(orderId: string): ServiceOrder | undefined {
    return this.ordersState().find((order) => order.id === orderId);
  }

  getOrderDetailsById(orderId: string): ServiceOrderDetails | undefined {
    return this.orderDetails().find((details) => details.order.id === orderId);
  }

  getInspectionOrders(status?: ServiceOrderStatus): ServiceOrderDetails[] {
    return this.orderDetails().filter(
      (details) =>
        details.order.type === 'inspection' && (!status || details.order.status === status),
    );
  }

  getActiveInspectionOrderByDeviceId(deviceId: string): ServiceOrder | undefined {
    return this.ordersState().find(
      (order) =>
        order.serviceData.type === 'inspection' &&
        OPEN_ORDER_STATUSES.includes(order.status) &&
        order.serviceData.deviceIds.includes(deviceId),
    );
  }

  getActiveInspectionOrdersByCustomerId(customerId: string, excludedDeviceId = ''): ServiceOrder[] {
    return this.ordersState()
      .filter(
        (order) =>
          order.serviceData.type === 'inspection' &&
          order.customerId === customerId &&
          OPEN_ORDER_STATUSES.includes(order.status) &&
          (!excludedDeviceId || !order.serviceData.deviceIds.includes(excludedDeviceId)),
      )
      .sort((left, right) => left.scheduledAt.localeCompare(right.scheduledAt));
  }

  getOrderDevices(order: ServiceOrder): ServiceOrderDevice[] {
    if (order.serviceData.type === 'installation') {
      return [];
    }

    if (order.serviceData.devices.length) {
      return order.serviceData.devices;
    }

    const customer = order.customerId
      ? this.customersStore.getCustomerById(order.customerId)
      : undefined;

    if (!customer || order.serviceData.type !== 'inspection') {
      return [];
    }

    return order.serviceData.deviceIds
      .map((deviceId) => customer.devices.find((device) => device.id === deviceId))
      .filter((device): device is Device => Boolean(device))
      .map(toServiceOrderDevice);
  }

  createInspectionOrder(input: {
    customerId: string;
    deviceIds: string[];
    scheduledAt: string;
    status?: ServiceOrderStatus;
  }): ServiceOrder | undefined {
    const customer = this.customersStore.getCustomerById(input.customerId);
    const deviceIds = Array.from(new Set(input.deviceIds.map((id) => id.trim()).filter(Boolean)));

    const scheduledAt = normalizeDateTime(input.scheduledAt);

    if (!customer || !deviceIds.length || !scheduledAt) {
      return undefined;
    }

    const now = new Date().toISOString();
    const order: ServiceOrder = {
      id: createEntityId('order'),
      type: 'inspection',
      source: 'user',
      status: input.status ?? 'new',
      ...toServiceOrderCustomer(customer),
      serviceData: {
        type: 'inspection',
        deviceIds,
        devices: [],
        customerConfirmationStatus: 'pending',
      },
      orderDate: now,
      scheduledAt,
      createdAt: now,
      updatedAt: now,
    };

    this.ordersState.update((orders) => [order, ...orders]);

    return order;
  }

  scheduleOrder(orderId: string, scheduledAt: string): ServiceOrder | undefined {
    const normalizedDate = normalizeDateTime(scheduledAt);

    if (!normalizedDate) {
      return undefined;
    }

    return this.patchOrder(orderId, {
      scheduledAt: normalizedDate,
      nextContactAt: undefined,
      status: 'scheduled',
    });
  }

  scheduleNextContact(
    orderId: string,
    nextContactAt: string,
    noteContent: string,
  ): ServiceOrder | undefined {
    const normalizedDate = normalizeDateTime(nextContactAt);

    if (!normalizedDate) {
      return undefined;
    }

    const order = this.getOrderById(orderId);

    if (!order) {
      return undefined;
    }

    const updatedOrder = this.patchOrder(orderId, {
      nextContactAt: normalizedDate,
      status: order.scheduledAt ? order.status : 'contact_required',
    });

    if (noteContent.trim()) {
      this.addNote(orderId, noteContent);
    }

    return updatedOrder;
  }

  assignAssignee(
    orderId: string,
    userId: string,
    assignee: ServiceOrderAssignee,
  ): ServiceOrder | undefined {
    if (!userId.trim()) {
      return undefined;
    }

    return this.patchOrder(orderId, { assignee });
  }

  completeOrder(orderId: string): ServiceOrder | undefined {
    return this.patchOrder(orderId, { status: 'completed' });
  }

  cancelOrder(orderId: string): ServiceOrder | undefined {
    return this.patchOrder(orderId, { status: 'cancelled' });
  }

  setInspectionConfirmation(orderId: string, isConfirmed: boolean): ServiceOrder | undefined {
    const order = this.getOrderById(orderId);

    if (!order || order.serviceData.type !== 'inspection') {
      return undefined;
    }

    return this.patchOrder(orderId, {
      status: 'contact_required',
      serviceData: {
        ...order.serviceData,
        customerConfirmationStatus: isConfirmed ? 'confirmed' : 'not_confirmed',
        confirmationReminderSentAt:
          order.serviceData.confirmationReminderSentAt ?? new Date().toISOString(),
      },
    });
  }

  addNote(orderId: string, content: string): ServiceOrderNote | undefined {
    const normalizedContent = content.trim();

    if (!this.getOrderById(orderId) || !normalizedContent) {
      return undefined;
    }

    const note: ServiceOrderNote = {
      id: createEntityId('order-note'),
      serviceOrderId: orderId,
      content: normalizedContent,
      authorId: 'current-user',
      createdAt: new Date().toISOString(),
    };

    this.notesState.update((notes) => [note, ...notes]);

    return note;
  }

  attachDeviceToInspectionOrder(orderId: string, deviceId: string): ServiceOrder | undefined {
    const order = this.getOrderById(orderId);

    if (!order || order.serviceData.type !== 'inspection') {
      return undefined;
    }

    for (const currentOrder of this.ordersState()) {
      if (
        currentOrder.id !== orderId &&
        currentOrder.serviceData.type === 'inspection' &&
        OPEN_ORDER_STATUSES.includes(currentOrder.status) &&
        currentOrder.serviceData.deviceIds.includes(deviceId)
      ) {
        this.removeDeviceFromInspectionOrder(currentOrder.id, deviceId);
      }
    }

    if (order.serviceData.deviceIds.includes(deviceId)) {
      return order;
    }

    return this.patchOrder(orderId, {
      serviceData: {
        ...order.serviceData,
        deviceIds: [...order.serviceData.deviceIds, deviceId],
      },
    });
  }

  removeDeviceFromInspectionOrder(
    orderId: string,
    deviceId: string,
    emptyStrategy: 'delete' | 'cancel' = 'delete',
  ): RemoveDeviceFromInspectionOrderResult {
    const order = this.getOrderById(orderId);

    if (
      !order ||
      order.serviceData.type !== 'inspection' ||
      !order.serviceData.deviceIds.includes(deviceId)
    ) {
      return {};
    }

    const deviceIds = order.serviceData.deviceIds.filter((id) => id !== deviceId);

    if (!deviceIds.length) {
      if (emptyStrategy === 'cancel') {
        return { cancelledOrder: this.cancelOrder(orderId) };
      }

      this.deleteOrder(orderId);
      return { deletedOrder: order };
    }

    return {
      updatedOrder: this.patchOrder(orderId, {
        serviceData: { ...order.serviceData, deviceIds },
      }),
    };
  }

  moveDeviceToNewInspectionOrder(
    customerId: string,
    currentOrderId: string,
    deviceId: string,
    scheduledAt: string,
  ): ServiceOrder | undefined {
    this.removeDeviceFromInspectionOrder(currentOrderId, deviceId);

    return this.createInspectionOrder({ customerId, deviceIds: [deviceId], scheduledAt });
  }

  deleteOrder(orderId: string): void {
    this.ordersState.update((orders) => orders.filter((order) => order.id !== orderId));
    this.notesState.update((notes) => notes.filter((note) => note.serviceOrderId !== orderId));
  }

  private patchOrder(orderId: string, patch: Partial<ServiceOrder>): ServiceOrder | undefined {
    let updatedOrder: ServiceOrder | undefined;

    this.ordersState.update((orders) =>
      orders.map((order) => {
        if (order.id !== orderId) {
          return order;
        }

        updatedOrder = {
          ...order,
          ...patch,
          updatedAt: new Date().toISOString(),
        } as ServiceOrder;

        return updatedOrder;
      }),
    );

    return updatedOrder;
  }

  private createInitialOrders(): ServiceOrder[] {
    const seededOrders = SERVICE_ORDER_MOCK_DATA.orders.map(
      ({ initialNote: _initialNote, note: _note, ...order }) => order,
    );
    const now = new Date().toISOString();
    const inspectionSeeds: Array<{
      id: string;
      customerId: string;
      deviceIds: string[];
      date: string;
      status: ServiceOrderStatus;
      confirmation: CustomerConfirmationStatus;
      reminderSentAt: string;
    }> = [
      {
        id: 'inspection-01',
        customerId: 'customer-01',
        deviceIds: ['device-01', 'device-02'],
        date: '2026-05-12',
        status: 'contact_required',
        confirmation: 'confirmed',
        reminderSentAt: '2026-05-10T08:00:00',
      },
      {
        id: 'inspection-02',
        customerId: 'customer-02',
        deviceIds: ['device-03'],
        date: '2026-05-24',
        status: 'contact_required',
        confirmation: 'not_confirmed',
        reminderSentAt: '2026-05-22T08:00:00',
      },
    ];
    const inspectionOrders = inspectionSeeds
      .map((seed): ServiceOrder | null => {
        const customer = this.customersStore.getCustomerById(seed.customerId);

        return customer
          ? {
              id: seed.id,
              type: 'inspection',
              source: 'system',
              status: seed.status,
              ...toServiceOrderCustomer(customer),
              serviceData: {
                type: 'inspection',
                deviceIds: seed.deviceIds,
                devices: [],
                customerConfirmationStatus: seed.confirmation,
                confirmationReminderSentAt: seed.reminderSentAt,
              },
              orderDate: now,
              scheduledAt: normalizeDateTime(seed.date),
              createdAt: now,
              updatedAt: now,
            }
          : null;
      })
      .filter((order): order is ServiceOrder => Boolean(order));

    return [...inspectionOrders, ...seededOrders];
  }
}

function toServiceOrderCustomer(customer: Customer): ServiceOrderCustomer {
  return {
    customerId: customer.id,
    customerType: customer.type,
    fullName: customer.fullName,
    companyName: customer.companyName,
    phone: customer.phone,
    email: customer.email,
    address: customer.address,
    postalCode: customer.postalCode,
    city: customer.city,
  };
}

function toServiceOrderDevice(device: Device): ServiceOrderDevice {
  return {
    id: device.id,
    systemDeviceId: device.id,
    type: device.type,
    brand: device.brand,
    model: device.model,
    serialNumber: device.serialNumber,
    refrigerant: device.refrigerant,
    refrigerantAmount: device.refrigerantAmount,
    nameplatePhotos: [],
  };
}

function createInitialNotes(): ServiceOrderNote[] {
  return SERVICE_ORDER_MOCK_DATA.orders
    .filter((order) => Boolean((order.initialNote ?? order.note)?.trim()))
    .map((order) => ({
      id: `order-note-${order.id}`,
      serviceOrderId: order.id,
      content: (order.initialNote ?? order.note)!,
      authorId: 'system',
      createdAt: order.createdAt,
    }));
}

function createEntityId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeDateTime(value: string): string {
  const normalizedValue = value.trim();

  return /^\d{4}-\d{2}-\d{2}$/.test(normalizedValue) ? `${normalizedValue}T09:00` : normalizedValue;
}
