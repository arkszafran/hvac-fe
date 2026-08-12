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
});
