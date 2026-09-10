import { TestBed } from '@angular/core/testing';
import { EMPTY } from 'rxjs';

import { ApiClientService } from '../api-client.service';
import { CreateVisitDto } from './visits.model';
import { VisitsApi } from './visits.api';

const VISIT: CreateVisitDto = {
  type: 'repair',
  performedOn: '2026-09-09',
  serviceOrderId: 'service-order-1',
  customer: { kind: 'existing', customerId: 'customer-1' },
  devices: [{ kind: 'existing', deviceId: 'device-1', visitNote: 'Repaired' }],
  nextInspection: null,
  attachments: [],
};

describe('VisitsApi', () => {
  const get = vi.fn();
  const post = vi.fn().mockReturnValue(EMPTY);
  let api: VisitsApi;

  beforeEach(() => {
    get.mockReset();
    post.mockClear();
    get.mockReturnValue(EMPTY);
    TestBed.configureTestingModule({
      providers: [VisitsApi, { provide: ApiClientService, useValue: { get, post } }],
    });
    api = TestBed.inject(VisitsApi);
  });

  it('passes server pagination, search and sorting parameters to GET /visits', () => {
    api.listVisits({
      q: 'customer',
      page: 2,
      pageSize: 25,
      sortBy: 'createdAt',
      sortDirection: 'asc',
    });

    expect(get).toHaveBeenCalledWith('/visits', {
      params: {
        q: 'customer',
        page: 2,
        pageSize: 25,
        sortBy: 'createdAt',
        sortDirection: 'asc',
      },
    });
  });

  it('adds the required idempotency header to POST /visits', () => {
    const idempotencyKey = '949f46bd-1d73-4d32-8dad-28b105f40a6e';

    api.createVisit(VISIT, idempotencyKey);

    expect(post).toHaveBeenCalledWith('/visits', VISIT, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
  });
});
