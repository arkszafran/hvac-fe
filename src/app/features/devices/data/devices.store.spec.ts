import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { DevicesApi } from '../../../common/api';
import { DevicesStore } from './devices.store';

const DEVICES = [
  {
    id: 'device-1',
    customerId: 'customer-1',
    type: 'air_conditioning' as const,
    brand: 'Daikin',
    model: 'Stylish',
    location: 'Salon',
    hasCustomInstallationAddress: false,
    address: '',
    postalCode: '',
    city: '',
    customer: {
      id: 'customer-1',
      type: 'company' as const,
      companyName: 'Łódź Klima',
      fullName: 'Anna Kowalska',
      phone: '+48 500 100 200',
      email: 'anna@example.com',
      address: 'ul. Testowa 1',
      postalCode: '90-001',
      city: 'Łódź',
    },
  },
  {
    id: 'device-2',
    customerId: 'customer-2',
    type: 'heat_pump' as const,
    brand: 'Panasonic',
    model: 'Aquarea',
    location: 'Kotłownia',
    hasCustomInstallationAddress: true,
    address: 'ul. Druga 2',
    postalCode: '00-001',
    city: 'Warszawa',
    customer: {
      id: 'customer-2',
      type: 'individual' as const,
      companyName: null,
      fullName: 'Jan Nowak',
      phone: '+48 600 100 200',
      email: 'jan@example.com',
      address: 'ul. Trzecia 3',
      postalCode: '00-002',
      city: 'Warszawa',
    },
  },
];

describe('DevicesStore', () => {
  const listDevices = vi.fn();
  let store: DevicesStore;

  beforeEach(() => {
    listDevices.mockReset();
    TestBed.configureTestingModule({
      providers: [{ provide: DevicesApi, useValue: { listDevices } }],
    });
    store = TestBed.inject(DevicesStore);
  });

  it('filters client-mode results locally after the first request', () => {
    listDevices.mockReturnValue(
      of({
        success: true as const,
        data: {
          filteringMode: 'client' as const,
          items: DEVICES,
          totalItems: DEVICES.length,
        },
      }),
    );

    store.search('lodz');

    expect(listDevices).toHaveBeenCalledWith({ q: 'lodz', page: 1 });
    expect(store.devices().map((device) => device.id)).toEqual(['device-1']);
    expect(store.pagination()).toBeNull();

    store.search('panasonic');

    expect(listDevices).toHaveBeenCalledOnce();
    expect(store.devices().map((device) => device.id)).toEqual(['device-2']);
  });

  it('uses backend pagination in server mode and preserves the query', () => {
    listDevices
      .mockReturnValueOnce(
        of({
          success: true as const,
          data: {
            filteringMode: 'server' as const,
            items: [DEVICES[0]],
            pagination: { page: 1, pageSize: 1, totalItems: 2, totalPages: 2 },
          },
        }),
      )
      .mockReturnValueOnce(
        of({
          success: true as const,
          data: {
            filteringMode: 'server' as const,
            items: [DEVICES[1]],
            pagination: { page: 2, pageSize: 1, totalItems: 2, totalPages: 2 },
          },
        }),
      );

    store.search('klima');
    store.goToPage(2);

    expect(listDevices).toHaveBeenLastCalledWith({ q: 'klima', page: 2 });
    expect(store.page()).toBe(2);
    expect(store.pagination()?.totalPages).toBe(2);
    expect(store.devices().map((device) => device.id)).toEqual(['device-2']);
  });
});
