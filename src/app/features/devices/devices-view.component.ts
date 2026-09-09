import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { CustomerSummaryDto } from '../../common/api';
import {
  UiButtonComponent,
  UiEmptyStateComponent,
  UiIconComponent,
  UiPaginationComponent,
} from '../../ui';
import { DeviceCustomerModalComponent } from './components/device-customer-modal.component';
import { DeviceTableComponent } from './components/device-table.component';
import { DeviceToolbarComponent } from './components/device-toolbar.component';
import { DevicesStore } from './data/devices.store';

@Component({
  selector: 'app-devices-view',
  imports: [
    TranslocoPipe,
    UiButtonComponent,
    UiEmptyStateComponent,
    UiIconComponent,
    UiPaginationComponent,
    DeviceCustomerModalComponent,
    DeviceTableComponent,
    DeviceToolbarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './devices-view.component.html',
})
export class DevicesViewComponent {
  private readonly router = inject(Router);
  private readonly devicesStore = inject(DevicesStore);

  protected readonly devices = this.devicesStore.devices;
  protected readonly pagination = this.devicesStore.pagination;
  protected readonly hasLoaded = this.devicesStore.hasLoaded;
  protected readonly hasError = this.devicesStore.hasError;
  protected readonly searchControl = new FormControl(this.devicesStore.query(), {
    nonNullable: true,
  });
  protected readonly selectedCustomer = signal<CustomerSummaryDto | null>(null);

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((query) => this.devicesStore.search(query));

    this.devicesStore.load();
  }

  protected navigateToCreateDevice(): void {
    void this.router.navigate(['/devices/new']);
  }

  protected handleDevicePreview(device: { id: string }): void {
    void this.router.navigate(['/devices', device.id]);
  }

  protected handlePageChange(page: number): void {
    this.devicesStore.goToPage(page);
  }

  protected retryLoad(): void {
    this.devicesStore.load();
  }
}
