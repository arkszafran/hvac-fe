import { TestBed } from '@angular/core/testing';

import { AuthService } from '../../../common/authentication';
import { CustomersStore } from '../../customers/data/customers.store';
import { VisitsStore } from './visits.store';

describe('VisitsStore', () => {
  let customersStore: CustomersStore;
  let visitsStore: VisitsStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CustomersStore,
        VisitsStore,
        {
          provide: AuthService,
          useValue: { user: () => ({ name: 'Test technician' }) },
        },
      ],
    });

    customersStore = TestBed.inject(CustomersStore);
    visitsStore = TestBed.inject(VisitsStore);
  });

  it('stores visit photos in the device service history', () => {
    const photo = {
      id: 'visit-photo-1',
      fileName: 'device.jpg',
      url: 'blob:device-photo',
    };

    const visit = visitsStore.createVisit({
      customerId: 'customer-01',
      devicesList: ['device-01'],
      date: '2026-08-12',
      type: 'inspection',
      devicesNotes: [{ deviceId: 'device-01', note: 'Inspection completed' }],
      photos: [photo],
    });
    const device = customersStore.getDeviceById('customer-01', 'device-01');

    expect(visit?.photos).toEqual([photo]);
    expect(device?.visits.find((item) => item.id === visit?.id)?.photos).toEqual([photo]);
  });
});
