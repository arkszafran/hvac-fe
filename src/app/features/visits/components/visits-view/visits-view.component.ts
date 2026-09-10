import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import {
  VisitCustomerSummaryDto,
  VisitDeviceDto,
  VisitDeviceSummaryDto,
  VisitListItemDto,
} from '../../../../common/api';
import {
  UiBadgeComponent,
  UiButtonComponent,
  UiEmptyStateComponent,
  UiIconComponent,
  UiInputComponent,
  UiPaginationComponent,
} from '../../../../ui';
import { VisitsStore } from '../../data/visits.store';
import { getVisitTypeLabel, VisitType } from '../../models/visit.model';

@Component({
  selector: 'app-visits-view',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslocoPipe,
    UiBadgeComponent,
    UiButtonComponent,
    UiEmptyStateComponent,
    UiIconComponent,
    UiInputComponent,
    UiPaginationComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './visits-view.component.html',
})
export class VisitsViewComponent {
  private readonly router = inject(Router);
  private readonly visitsStore = inject(VisitsStore);
  private readonly transloco = inject(TranslocoService);
  private readonly activeLanguage = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  protected readonly visits = this.visitsStore.visits;
  protected readonly pagination = this.visitsStore.pagination;
  protected readonly hasLoaded = this.visitsStore.hasLoaded;
  protected readonly hasError = this.visitsStore.hasError;
  protected readonly searchControl = new FormControl(this.visitsStore.query(), {
    nonNullable: true,
  });

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((query) => this.visitsStore.search(query));

    this.visitsStore.load();
  }

  protected getVisitTypeLabel(type: VisitType): string {
    this.activeLanguage();

    return getVisitTypeLabel(type, this.transloco);
  }

  protected navigateToCreateVisit(): void {
    void this.router.navigate(['/visits/new']);
  }

  protected retryLoad(): void {
    this.visitsStore.load();
  }

  protected handlePageChange(page: number): void {
    this.visitsStore.goToPage(page);
  }

  protected totalVisits(): number {
    return this.pagination()?.totalItems ?? this.visits().length;
  }

  protected customerName(customer: VisitCustomerSummaryDto): string {
    return (
      customer.companyName ||
      customer.fullName ||
      this.transloco.translate('customers.fallbackName')
    );
  }

  protected formatDate(value: string): string {
    if (!value) {
      return '--';
    }

    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat(this.activeLanguage() === 'pl' ? 'pl-PL' : 'en-US').format(
      parsedDate,
    );
  }

  protected deviceItems(visit: VisitListItemDto): VisitDeviceDto[] {
    return visit.devices;
  }

  protected deviceName(device: VisitDeviceSummaryDto): string {
    return (
      `${device.brand} ${device.model}`.trim() || this.transloco.translate('devices.table.device')
    );
  }

  protected deviceAddressSummary(visit: VisitListItemDto): string {
    const addresses = Array.from(
      new Set(visit.devices.map(({ device }) => this.deviceAddress(visit.customer, device))),
    ).filter((address) => address !== '--');

    return addresses.join(' | ') || '--';
  }

  protected phoneHref(phone: string): string {
    const normalizedPhone = phone.replace(/[^\d+]/g, '');

    return normalizedPhone ? `tel:${normalizedPhone}` : '#';
  }

  private deviceAddress(customer: VisitCustomerSummaryDto, device: VisitDeviceSummaryDto): string {
    const street = device.hasCustomInstallationAddress ? device.address : customer.address;
    const cityLine = device.hasCustomInstallationAddress
      ? `${device.postalCode} ${device.city}`.trim()
      : `${customer.postalCode} ${customer.city}`.trim();

    return [street, cityLine].filter(Boolean).join(', ') || '--';
  }
}
