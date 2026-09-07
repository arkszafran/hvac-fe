import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { firstValueFrom, of } from 'rxjs';

import {
  CustomerDeviceListItemDto,
  CustomerDto,
  CustomersApi,
  DeviceDto,
  InspectionServiceOrderDto,
  ServiceOrdersApi,
} from '../../../common/api';
import { DeviceDraft } from '../models/device.model';
import { CustomerDeviceFlowService } from './customer-device-flow.service';

const CUSTOMER: CustomerDto = {
  id: 'customer-1',
  type: 'company',
  companyName: 'HVAC Customer',
  fullName: '',
  phone: '123456789',
  email: 'customer@example.com',
  address: 'Main Street 1',
  postalCode: '00-001',
  city: 'Warsaw',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const DEVICE: DeviceDto = {
  id: 'device-1',
  customerId: CUSTOMER.id,
  type: 'air_conditioning',
  brand: 'Brand',
  model: 'Model',
  powerKw: 3.5,
  serialNumber: 'SN-1',
  installationDate: '2025-01-01',
  warrantyMonths: 24,
  warrantyUntil: '2027-01-01',
  note: '',
  refrigerant: 'R32',
  refrigerantAmount: '1 kg',
  location: 'Office',
  hasCustomInstallationAddress: false,
  address: '',
  postalCode: '',
  city: '',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const ACTIVE_INSPECTION: InspectionServiceOrderDto = {
  id: 'service-order-1',
  customerId: CUSTOMER.id,
  type: 'inspection',
  source: 'user',
  status: 'scheduled',
  assigneeUserId: null,
  orderDate: '2026-06-01',
  scheduledAt: '2026-10-10T10:00:00.000Z',
  nextContactAt: null,
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
};

const SIBLING_DEVICE: CustomerDeviceListItemDto = {
  id: 'device-2',
  customerId: CUSTOMER.id,
  type: 'heat_pump',
  brand: 'Sibling',
  model: 'Device',
  serialNumber: 'SN-2',
  installationDate: '2025-02-01',
  location: 'Warehouse',
  hasCustomInstallationAddress: false,
  address: '',
  postalCode: '',
  city: '',
  activeInspection: ACTIVE_INSPECTION,
};

const BASE_DRAFT: DeviceDraft = {
  type: 'air-conditioning',
  brand: DEVICE.brand,
  model: DEVICE.model,
  powerKw: DEVICE.powerKw,
  serialNumber: DEVICE.serialNumber,
  installationDate: DEVICE.installationDate,
  warrantyMonths: DEVICE.warrantyMonths,
  note: DEVICE.note,
  refrigerant: DEVICE.refrigerant,
  refrigerantAmount: DEVICE.refrigerantAmount,
  location: DEVICE.location,
  hasCustomInstallationAddress: DEVICE.hasCustomInstallationAddress,
  address: DEVICE.address,
  postalCode: DEVICE.postalCode,
  city: DEVICE.city,
  hasScheduledInspections: false,
  nextInspectionDate: '',
};

describe('CustomerDeviceFlowService lazy customer details', () => {
  const getCustomerDetails = vi.fn<CustomersApi['getCustomerDetails']>();
  const listServiceOrders = vi.fn<ServiceOrdersApi['listServiceOrders']>();
  let service: CustomerDeviceFlowService;

  beforeEach(() => {
    getCustomerDetails.mockReset();
    listServiceOrders.mockReset();

    TestBed.configureTestingModule({
      providers: [
        CustomerDeviceFlowService,
        { provide: CustomersApi, useValue: { getCustomerDetails } },
        { provide: ServiceOrdersApi, useValue: { listServiceOrders } },
        {
          provide: TranslocoService,
          useValue: { translate: (key: string) => key },
        },
      ],
    });

    service = TestBed.inject(CustomerDeviceFlowService);
  });

  it('does not load customer details when the update does not affect inspections', async () => {
    const plan = await firstValueFrom(
      service.previewUpdateDeviceForCustomer(CUSTOMER.id, DEVICE, null, BASE_DRAFT),
    );

    expect(plan).toEqual({ kind: 'apply' });
    expect(getCustomerDetails).not.toHaveBeenCalled();
    expect(listServiceOrders).not.toHaveBeenCalled();
  });

  it('loads customer details and candidates when enabling inspections', async () => {
    getCustomerDetails.mockReturnValue(
      of({
        success: true,
        data: { customer: CUSTOMER, devices: [SIBLING_DEVICE], serviceOrders: [] },
      }),
    );
    listServiceOrders.mockReturnValue(of({ success: true, data: [] }));
    const draft: DeviceDraft = {
      ...BASE_DRAFT,
      hasScheduledInspections: true,
      nextInspectionDate: '2026-10-10T10:00',
    };

    const plan = await firstValueFrom(
      service.previewUpdateDeviceForCustomer(CUSTOMER.id, DEVICE, null, draft),
    );

    expect(plan).toEqual({
      kind: 'apply',
      command: {
        action: 'create_inspection',
        scheduledAt: draft.nextInspectionDate,
      },
    });
    expect(getCustomerDetails).toHaveBeenCalledWith(CUSTOMER.id);
    expect(listServiceOrders).toHaveBeenCalledWith({
      customerId: CUSTOMER.id,
      type: 'inspection',
      active: true,
      excludeDeviceId: DEVICE.id,
    });
  });

  it('loads customer details to detect other devices sharing a rescheduled inspection', async () => {
    getCustomerDetails.mockReturnValue(
      of({
        success: true,
        data: { customer: CUSTOMER, devices: [SIBLING_DEVICE], serviceOrders: [] },
      }),
    );
    const draft: DeviceDraft = {
      ...BASE_DRAFT,
      hasScheduledInspections: true,
      nextInspectionDate: '2026-11-15T12:00',
    };

    const plan = await firstValueFrom(
      service.previewUpdateDeviceForCustomer(CUSTOMER.id, DEVICE, ACTIVE_INSPECTION, draft),
    );

    expect(plan.kind).toBe('single-candidate');
    if (plan.kind === 'single-candidate') {
      expect(plan.relatedDevices).toEqual([
        {
          id: SIBLING_DEVICE.id,
          brand: SIBLING_DEVICE.brand,
          model: SIBLING_DEVICE.model,
          address: 'Main Street 1, 00-001 Warsaw',
        },
      ]);
    }
    expect(getCustomerDetails).toHaveBeenCalledWith(CUSTOMER.id);
    expect(listServiceOrders).not.toHaveBeenCalled();
  });
});
