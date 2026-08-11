import { ServiceOrder } from '../models/service-order.model';
import { getServiceOrderInspectionConfirmation } from './service-order-ui.util';

describe('getServiceOrderInspectionConfirmation', () => {
  it('returns an unconfirmed inspection awaiting employee confirmation', () => {
    expect(getServiceOrderInspectionConfirmation(createInspectionOrder())).toEqual({
      status: 'not_confirmed',
      scheduledAt: '2026-05-18T10:00:00',
      reminderSentAt: '2026-05-16T08:00:00',
    });
  });

  it('returns a customer-confirmed inspection that still requires a call', () => {
    const order = createInspectionOrder();

    expect(
      getServiceOrderInspectionConfirmation({
        ...order,
        serviceData: { ...order.serviceData, customerConfirmationStatus: 'confirmed' },
      }),
    ).toMatchObject({ status: 'confirmed' });
  });

  it('does not return a box while confirmation is pending', () => {
    const order = createInspectionOrder();

    expect(
      getServiceOrderInspectionConfirmation({
        ...order,
        serviceData: { ...order.serviceData, customerConfirmationStatus: 'pending' },
      }),
    ).toBeNull();
  });

  it('does not return a box after the visit date is finally scheduled', () => {
    expect(
      getServiceOrderInspectionConfirmation({
        ...createInspectionOrder(),
        status: 'scheduled',
      }),
    ).toBeNull();
  });

  it('does not return a box without a proposed visit date', () => {
    expect(
      getServiceOrderInspectionConfirmation({
        ...createInspectionOrder(),
        scheduledAt: '',
      }),
    ).toBeNull();
  });

  it('does not return a box for repair orders', () => {
    const inspection = createInspectionOrder();
    const repair: ServiceOrder = {
      ...inspection,
      type: 'repair',
      serviceData: { type: 'repair', devices: [] },
    };

    expect(getServiceOrderInspectionConfirmation(repair)).toBeNull();
  });
});

function createInspectionOrder(): ServiceOrder & {
  serviceData: Extract<ServiceOrder['serviceData'], { type: 'inspection' }>;
} {
  return {
    id: 'inspection-test',
    type: 'inspection',
    source: 'system',
    status: 'contact_required',
    customerType: 'individual',
    fullName: 'Jan Kowalski',
    companyName: '',
    phone: '+48 500 000 000',
    email: 'jan@example.com',
    address: 'ul. Testowa 1',
    postalCode: '00-001',
    city: 'Warszawa',
    serviceData: {
      type: 'inspection',
      deviceIds: ['device-test'],
      devices: [],
      customerConfirmationStatus: 'not_confirmed',
      confirmationReminderSentAt: '2026-05-16T08:00:00',
    },
    orderDate: '2026-05-15T08:00:00',
    scheduledAt: '2026-05-18T10:00:00',
    createdAt: '2026-05-15T08:00:00',
    updatedAt: '2026-05-16T08:00:00',
  };
}
