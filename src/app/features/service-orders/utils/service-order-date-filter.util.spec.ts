import { ServiceOrder } from '../models/service-order.model';
import {
  ServiceOrderDateFilter,
  matchesServiceOrderDateFilter,
} from './service-order-date-filter.util';

const CURRENT_DATE = new Date(2026, 6, 29, 12);

describe('matchesServiceOrderDateFilter', () => {
  it('always includes orders requiring contact and orders without a date', () => {
    expect(matches(createOrder('2026-08-20', 'contact_required'), 'today')).toBe(true);
    expect(matches(createOrder('', 'scheduled'), 'tomorrow')).toBe(true);
    expect(matches(createOrder('', 'scheduled'), 'this_week')).toBe(true);
  });

  it('includes overdue and current-day orders in the today filter', () => {
    expect(matches(createOrder('2026-07-20'), 'today')).toBe(true);
    expect(matches(createOrder('2026-07-29'), 'today')).toBe(true);
    expect(matches(createOrder('2026-07-30'), 'today')).toBe(false);
  });

  it('includes only orders scheduled for tomorrow in the tomorrow filter', () => {
    expect(matches(createOrder('2026-07-29'), 'tomorrow')).toBe(false);
    expect(matches(createOrder('2026-07-30'), 'tomorrow')).toBe(true);
    expect(matches(createOrder('2026-07-31'), 'tomorrow')).toBe(false);
  });

  it('includes the current week and unfinished overdue orders in the week filter', () => {
    expect(matches(createOrder('2026-07-27'), 'this_week')).toBe(true);
    expect(matches(createOrder('2026-08-02'), 'this_week')).toBe(true);
    expect(matches(createOrder('2026-07-20'), 'this_week')).toBe(true);
    expect(matches(createOrder('2026-07-20', 'completed'), 'this_week')).toBe(false);
    expect(matches(createOrder('2026-08-03'), 'this_week')).toBe(false);
  });

  it('includes every order in the all filter', () => {
    expect(matches(createOrder('2027-01-01'), 'all')).toBe(true);
  });
});

function matches(order: ServiceOrder, filter: ServiceOrderDateFilter): boolean {
  return matchesServiceOrderDateFilter(order, filter, CURRENT_DATE);
}

function createOrder(
  scheduledAt: string,
  status: ServiceOrder['status'] = 'scheduled',
): ServiceOrder {
  return {
    id: 'order-1',
    type: 'installation',
    source: 'user',
    status,
    orderDate: '2026-07-01',
    scheduledAt,
    createdAt: '2026-07-01',
    updatedAt: '2026-07-01',
    customerType: 'individual',
    fullName: 'Jan Kowalski',
    companyName: '',
    phone: '',
    email: '',
    address: '',
    postalCode: '',
    city: '',
    serviceData: {
      type: 'installation',
      buildingType: 'house',
      rooms: [],
      photos: [],
    },
  };
}
