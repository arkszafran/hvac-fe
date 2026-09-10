import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { VisitListItemDto, VisitsApi, VisitsListResponseDto } from '../../../common/api';
import { VisitsStore } from './visits.store';

const VISIT: VisitListItemDto = {
  id: 'visit-1',
  serviceOrderId: 'service-order-1',
  type: 'inspection',
  performedOn: '2026-09-09',
  handledBy: { id: 'user-1', name: 'Test technician' },
  customer: {
    id: 'customer-1',
    type: 'company',
    companyName: 'Test Customer',
    fullName: '',
    phone: '+48 500 100 200',
    email: 'customer@example.com',
    address: 'Test Street 1',
    postalCode: '00-001',
    city: 'Warsaw',
  },
  devices: [
    {
      device: {
        id: 'device-1',
        type: 'air_conditioning',
        brand: 'Brand',
        model: 'Model',
        location: 'Office',
        hasCustomInstallationAddress: false,
        address: '',
        postalCode: '',
        city: '',
      },
      note: 'Inspection completed',
    },
  ],
  createdAt: '2026-09-09T12:00:00.000Z',
};

describe('VisitsStore', () => {
  const listVisits = vi.fn<VisitsApi['listVisits']>();
  let store: VisitsStore;

  beforeEach(() => {
    listVisits.mockReset();
    TestBed.configureTestingModule({
      providers: [{ provide: VisitsApi, useValue: { listVisits } }],
    });
    store = TestBed.inject(VisitsStore);
  });

  it('loads visits and pagination from the API', () => {
    listVisits.mockReturnValue(of(createResponse(1, [VISIT])));

    store.load();

    expect(listVisits).toHaveBeenCalledWith({
      q: '',
      page: 1,
      sortBy: 'performedOn',
      sortDirection: 'desc',
    });
    expect(store.visits()).toEqual([VISIT]);
    expect(store.pagination()?.totalItems).toBe(1);
    expect(store.hasLoaded()).toBe(true);
    expect(store.hasError()).toBe(false);
  });

  it('delegates every search to the API instead of filtering locally', () => {
    listVisits.mockReturnValue(of(createResponse(1, [])));

    store.search('customer');
    store.search('device');

    expect(listVisits).toHaveBeenCalledTimes(2);
    expect(listVisits).toHaveBeenLastCalledWith({
      q: 'device',
      page: 1,
      sortBy: 'performedOn',
      sortDirection: 'desc',
    });
    expect(store.query()).toBe('device');
  });

  it('loads the selected page while preserving the server query', () => {
    listVisits
      .mockReturnValueOnce(of(createResponse(1, [VISIT], 2)))
      .mockReturnValueOnce(of(createResponse(2, [{ ...VISIT, id: 'visit-2' }], 2)));

    store.search('inspection');
    store.goToPage(2);

    expect(listVisits).toHaveBeenLastCalledWith({
      q: 'inspection',
      page: 2,
      sortBy: 'performedOn',
      sortDirection: 'desc',
    });
    expect(store.page()).toBe(2);
    expect(store.visits()[0].id).toBe('visit-2');
  });

  it('exposes an error state when loading fails', () => {
    listVisits.mockReturnValue(throwError(() => new Error('Network error')));

    store.load();

    expect(store.hasLoaded()).toBe(true);
    expect(store.hasError()).toBe(true);
  });
});

function createResponse(
  page: number,
  items: VisitListItemDto[],
  totalPages = 1,
): VisitsListResponseDto {
  return {
    success: true,
    data: {
      items,
      pagination: {
        page,
        pageSize: 20,
        totalItems: totalPages,
        totalPages,
      },
    },
  };
}
