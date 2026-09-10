import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { ServiceOrderListItemDto } from '../../../../common/api';
import {
  UiEmptyStateComponent,
  UiInputComponent,
  UiModalComponent,
  UiPaginationComponent,
} from '../../../../ui';
import { formatServiceOrderDate } from '../../../service-orders/utils/service-order-ui.util';
import { ScheduledInspectionsStore } from '../../data/scheduled-inspections.store';

@Component({
  selector: 'app-visit-scheduled-inspection-picker-modal',
  imports: [
    ReactiveFormsModule,
    TranslocoPipe,
    UiEmptyStateComponent,
    UiInputComponent,
    UiModalComponent,
    UiPaginationComponent,
  ],
  providers: [ScheduledInspectionsStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './visit-scheduled-inspection-picker-modal.component.html',
})
export class VisitScheduledInspectionPickerModalComponent {
  private readonly transloco = inject(TranslocoService);
  private readonly store = inject(ScheduledInspectionsStore);

  readonly open = input(false);
  readonly close = output<void>();
  readonly inspectionSelected = output<ServiceOrderListItemDto>();

  protected readonly inspections = this.store.inspections;
  protected readonly pagination = this.store.pagination;
  protected readonly hasLoaded = this.store.hasLoaded;
  protected readonly hasError = this.store.hasError;
  protected readonly searchControl = new FormControl('', { nonNullable: true });

  constructor() {
    effect(() => {
      if (this.open()) {
        untracked(() => this.store.load());
      }
    });

    this.searchControl.valueChanges
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((query) => this.store.search(query));
  }

  protected retryLoad(): void {
    this.store.load();
  }

  protected handlePageChange(page: number): void {
    this.store.goToPage(page);
  }

  protected formatInspectionDate(value: string): string {
    return formatServiceOrderDate(value, this.transloco.getActiveLang());
  }

  protected customerName(details: ServiceOrderListItemDto): string {
    return (
      details.customer.companyName ||
      details.customer.fullName ||
      this.transloco.translate('customers.fallbackName')
    );
  }

  protected devicesLabel(details: ServiceOrderListItemDto): string {
    return details.devices.map((device) => `${device.brand} ${device.model}`.trim()).join(', ');
  }
}
