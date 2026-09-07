import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { CustomersApi } from '../../../common/api';
import { CustomersListStore } from './customers-list.store';

const CUSTOMERS = [
  {
    id: 'customer-1',
    type: 'company' as const,
    companyName: 'Łódź Klima',
    fullName: 'Anna Kowalska',
    phone: '+48 500 100 200',
    email: 'anna@example.com',
    address: 'ul. Testowa 1',
    postalCode: '90-001',
    city: 'Łódź',
    createdAt: '2026-01-01T10:00:00Z',
    updatedAt: '2026-01-01T10:00:00Z',
  },
  {
    id: 'customer-2',
    type: 'individual' as const,
    companyName: '',
    fullName: 'Jan Nowak',
    phone: '+48 600 100 200',
    email: 'jan@example.com',
    address: 'ul. Druga 2',
    postalCode: '00-001',
    city: 'Warszawa',
    createdAt: '2026-01-02T10:00:00Z',
    updatedAt: '2026-01-02T10:00:00Z',
  },
];

describe('CustomersListStore', () => {
  const listCustomers = vi.fn();
  let store: CustomersListStore;

  beforeEach(() => {
    listCustomers.mockReset();
    TestBed.configureTestingModule({
      providers: [{ provide: CustomersApi, useValue: { listCustomers } }],
    });
    store = TestBed.inject(CustomersListStore);
  });

  it('sends the initial q and filters subsequent client-mode queries without API requests', () => {
    listCustomers.mockReturnValue(
      of({
        success: true as const,
        data: {
          filteringMode: 'client' as const,
          items: CUSTOMERS,
          totalItems: CUSTOMERS.length,
        },
      }),
    );

    store.search('lodz');

    expect(listCustomers).toHaveBeenCalledWith({
      q: 'lodz',
      page: 1,
      sortBy: 'displayName',
      sortDirection: 'asc',
    });
    expect(store.customers().map((customer) => customer.id)).toEqual(['customer-1']);
    expect(store.query()).toBe('lodz');
    expect(store.pagination()).toBeNull();

    store.search('jan@example.com');

    expect(listCustomers).toHaveBeenCalledOnce();
    expect(store.customers().map((customer) => customer.id)).toEqual(['customer-2']);
    expect(store.query()).toBe('jan@example.com');
  });

  it('uses backend pagination in server mode and keeps the current query', () => {
    listCustomers
      .mockReturnValueOnce(
        of({
          success: true as const,
          data: {
            filteringMode: 'server' as const,
            items: [CUSTOMERS[0]],
            pagination: { page: 1, pageSize: 1, totalItems: 2, totalPages: 2 },
          },
        }),
      )
      .mockReturnValueOnce(
        of({
          success: true as const,
          data: {
            filteringMode: 'server' as const,
            items: [CUSTOMERS[1]],
            pagination: { page: 2, pageSize: 1, totalItems: 2, totalPages: 2 },
          },
        }),
      );

    store.search('customer');
    store.goToPage(2);

    expect(listCustomers).toHaveBeenLastCalledWith({
      q: 'customer',
      page: 2,
      sortBy: 'displayName',
      sortDirection: 'asc',
    });
    expect(store.page()).toBe(2);
    expect(store.pagination()?.totalPages).toBe(2);
    expect(store.customers().map((customer) => customer.id)).toEqual(['customer-2']);
  });
});
