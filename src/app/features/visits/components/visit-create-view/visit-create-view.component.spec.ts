import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { Subject, of } from 'rxjs';

import {
  CustomerDetailsResponseDto,
  CustomersApi,
  ServiceOrdersApi,
  VisitsApi,
} from '../../../../common/api';
import { AttachmentUploadService } from '../../../../common/attachments';
import { ToastService } from '../../../../ui';
import { Customer } from '../../../customers/models/customer.model';
import { VisitCreateViewComponent } from './visit-create-view.component';

const CUSTOMER: Customer = {
  id: 'customer-1',
  type: 'company',
  companyName: 'Test Customer',
  fullName: '',
  phone: '+48 500 100 200',
  email: 'customer@example.com',
  address: 'Test Street 1',
  postalCode: '00-001',
  city: 'Warsaw',
  devices: [],
};

describe('VisitCreateViewComponent customer selection', () => {
  const customerDetails = new Subject<CustomerDetailsResponseDto>();
  const getCustomerDetails = vi.fn(() => customerDetails.asObservable());

  beforeEach(() => {
    getCustomerDetails.mockClear();
    TestBed.configureTestingModule({
      providers: [
        { provide: CustomersApi, useValue: { getCustomerDetails } },
        { provide: ServiceOrdersApi, useValue: {} },
        { provide: VisitsApi, useValue: {} },
        { provide: AttachmentUploadService, useValue: {} },
        { provide: ToastService, useValue: {} },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => null } } },
        },
        { provide: Router, useValue: { navigate: vi.fn() } },
        {
          provide: TranslocoService,
          useValue: {
            langChanges$: of('en'),
            getActiveLang: () => 'en',
            translate: (key: string) => key,
          },
        },
      ],
    });
  });

  it('selects the customer on the first click before details are loaded', () => {
    const fixture = TestBed.createComponent(VisitCreateViewComponent);
    const component = fixture.componentInstance as unknown as {
      selectCustomer(customer: Customer): void;
      selectedCustomer(): Customer | undefined;
    };

    component.selectCustomer(CUSTOMER);

    expect(component.selectedCustomer()).toEqual(CUSTOMER);
    expect(getCustomerDetails).toHaveBeenCalledOnce();
    expect(getCustomerDetails).toHaveBeenCalledWith(CUSTOMER.id);
  });
});
