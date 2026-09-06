import { TestBed } from '@angular/core/testing';

import { ServiceOrdersStore } from './service-orders.store';

describe('ServiceOrdersStore', () => {
  let store: ServiceOrdersStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(ServiceOrdersStore);
  });

  it('updates an inspection date without changing its status or next contact date', () => {
    const orderId = 'inspection-01';
    const originalOrder = store.getOrderById(orderId);

    expect(originalOrder).toBeDefined();

    store.scheduleNextContact(orderId, '2026-05-11T14:30', '');

    const updatedOrder = store.updateInspectionDate(orderId, '2026-06-18T09:15');

    expect(updatedOrder?.scheduledAt).toBe('2026-06-18T09:15');
    expect(updatedOrder?.status).toBe(originalOrder?.status);
    expect(updatedOrder?.nextContactAt).toBe('2026-05-11T14:30');
  });

  it('creates a scheduled installation order for an existing customer', () => {
    const order = store.createOrder({
      customerId: 'customer-01',
      scheduledAt: '2026-08-20T11:30',
      serviceData: {
        type: 'installation',
        buildingType: 'house',
        rooms: [
          {
            id: 'room-test',
            area: 24,
            height: 2.6,
            outdoorUnitPlace: 'wall',
            estimatedDistanceToOutdoorUnit: 5,
            floor: 1,
            photos: [],
          },
        ],
        photos: [],
      },
    });

    expect(order).toMatchObject({
      customerId: 'customer-01',
      type: 'installation',
      source: 'user',
      status: 'scheduled',
      scheduledAt: '2026-08-20T11:30',
    });
    expect(store.getOrderById(order?.id ?? '')).toEqual(order);
  });

  it('does not create a repair order without devices', () => {
    const order = store.createOrder({
      customerId: 'customer-01',
      serviceData: {
        type: 'repair',
        devices: [],
      },
    });

    expect(order).toBeUndefined();
  });

  it('keeps photos attached to the note they were added with', () => {
    const photo = {
      id: 'note-photo-1',
      fileName: 'inspection.jpg',
      url: 'blob:inspection-photo',
    };

    const note = store.addNote('inspection-01', 'Inspection arrangements', [photo]);
    const details = store.getOrderDetailsById('inspection-01');

    expect(note?.photos).toEqual([photo]);
    expect(details?.notes.find((item) => item.id === note?.id)?.photos).toEqual([photo]);
    expect(
      details?.notes.filter((item) => item.id !== note?.id).every((item) => !item.photos.length),
    ).toBe(true);
  });
});
