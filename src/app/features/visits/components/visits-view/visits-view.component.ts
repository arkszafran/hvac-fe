import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import {
  UiBadgeComponent,
  UiButtonComponent,
  UiEmptyStateComponent,
  UiInputComponent,
} from '../../../../ui';
import { Customer } from '../../../customers/models/customer.model';
import { Device } from '../../../customers/models/device.model';
import { VisitDetails, VisitsStore } from '../../data/visits.store';
import { getVisitTypeLabel } from '../../models/visit.model';

@Component({
  selector: 'app-visits-view',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    UiBadgeComponent,
    UiButtonComponent,
    UiEmptyStateComponent,
    UiInputComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './visits-view.component.html',
})
export class VisitsViewComponent {
  private readonly router = inject(Router);
  private readonly visitsStore = inject(VisitsStore);

  protected readonly searchQuery = signal('');
  protected readonly visitDetails = this.visitsStore.visitDetails;
  protected readonly filteredVisits = computed(() => {
    const query = normalizeValue(this.searchQuery());

    return this.visitDetails().filter((details) => {
      if (!query) {
        return true;
      }

      return normalizeValue(this.searchText(details)).includes(query);
    });
  });

  protected readonly getVisitTypeLabel = getVisitTypeLabel;

  protected navigateToCreateVisit(): void {
    void this.router.navigate(['/visits/new']);
  }

  protected customerName(customer: Customer): string {
    return customer.companyName || customer.fullName || 'Klient';
  }

  protected formatDate(value: string): string {
    if (!value) {
      return '--';
    }

    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('pl-PL').format(parsedDate);
  }

  protected deviceSummary(details: VisitDetails): string {
    if (!details.devices.length) {
      return '--';
    }

    return details.devices
      .map((device) => {
        const note = details.visit.devicesNotes.find((item) => item.deviceId === device.id)?.note;
        const deviceName = `${device.brand} ${device.model}`.trim() || 'Urządzenie';

        return note ? `${deviceName}: ${note}` : deviceName;
      })
      .join(' | ');
  }

  protected deviceItems(details: VisitDetails): Array<{ device: Device; label: string; note: string }> {
    return details.devices.map((device) => ({
      device,
      label: `${device.brand} ${device.model}`.trim() || 'Urządzenie',
      note: details.visit.devicesNotes.find((item) => item.deviceId === device.id)?.note ?? '',
    }));
  }

  protected deviceAddressSummary(details: VisitDetails): string {
    const addresses = Array.from(
      new Set(details.devices.map((device) => this.deviceAddress(details.customer, device))),
    ).filter((address) => address !== '--');

    if (!addresses.length) {
      return '--';
    }

    return addresses.join(' | ');
  }

  protected phoneHref(phone: string): string {
    const normalizedPhone = phone.replace(/[^\d+]/g, '');

    return normalizedPhone ? `tel:${normalizedPhone}` : '#';
  }

  private searchText(details: VisitDetails): string {
    return [
      this.customerName(details.customer),
      details.customer.fullName,
      details.customer.phone,
      details.customer.email,
      details.customer.address,
      details.customer.postalCode,
      details.customer.city,
      details.devices.map((device) => this.deviceAddress(details.customer, device)).join(' '),
      this.deviceSummary(details),
    ].join(' ');
  }

  private deviceAddress(customer: Customer, device: Device): string {
    const street = device.hasCustomInstallationAddress ? device.address : customer.address;
    const cityLine = device.hasCustomInstallationAddress
      ? `${device.postalCode} ${device.city}`.trim()
      : `${customer.postalCode} ${customer.city}`.trim();

    return [street, cityLine].filter(Boolean).join(', ') || '--';
  }
}

function normalizeValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
