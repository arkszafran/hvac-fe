import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { UiButtonComponent } from '../button/button.component';
import { UiIconComponent } from '../icon/icon.component';

@Component({
  selector: 'ui-pagination',
  imports: [TranslocoPipe, UiButtonComponent, UiIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pagination.component.html',
})
export class UiPaginationComponent {
  readonly page = input(1);
  readonly totalPages = input(1);
  readonly pageChange = output<number>();

  protected readonly normalizedTotalPages = computed(() => normalizePage(this.totalPages(), 1));
  protected readonly currentPage = computed(() =>
    Math.min(normalizePage(this.page(), 1), this.normalizedTotalPages()),
  );
  protected readonly hasPreviousPage = computed(() => this.currentPage() > 1);
  protected readonly hasNextPage = computed(() => this.currentPage() < this.normalizedTotalPages());

  protected previousPage(): void {
    if (this.hasPreviousPage()) {
      this.pageChange.emit(this.currentPage() - 1);
    }
  }

  protected nextPage(): void {
    if (this.hasNextPage()) {
      this.pageChange.emit(this.currentPage() + 1);
    }
  }
}

function normalizePage(value: number, fallback: number): number {
  return Number.isFinite(value) ? Math.max(1, Math.trunc(value)) : fallback;
}
