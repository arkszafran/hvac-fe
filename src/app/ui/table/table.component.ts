import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { UiBadgeComponent } from '../badge/badge.component';
import type { UiBadgeVariant } from '../badge/badge.component';
import { classNames } from '../utils/classnames';

export type UiTableRow = object;
export type UiTableAlign = 'start' | 'center' | 'end';
export type UiTableColumnType = 'text' | 'badge';

export interface UiTableColumn<T extends UiTableRow = UiTableRow> {
  id: string;
  header: string;
  key?: keyof T & string;
  cell?: (row: T) => string;
  description?: (row: T) => string;
  align?: UiTableAlign;
  type?: UiTableColumnType;
  width?: string;
  badgeVariant?: UiBadgeVariant | ((value: string, row: T) => UiBadgeVariant);
}

const DESKTOP_ALIGNMENT_CLASSES: Record<UiTableAlign, string> = {
  start: 'text-left',
  center: 'text-center',
  end: 'text-right',
};

const MOBILE_ALIGNMENT_CLASSES: Record<UiTableAlign, string> = {
  start: 'items-start text-left',
  center: 'items-center text-center',
  end: 'items-end text-right',
};

@Component({
  selector: 'ui-table',
  standalone: true,
  imports: [UiBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="overflow-hidden rounded-[1.6rem] border border-black/6 bg-white/84 shadow-card">
      @if (hasRows()) {
        <div
          class="border-b border-black/5 bg-[linear-gradient(180deg,_rgb(255_255_255/0.96),_rgb(247_249_252/0.9))] px-4 py-3.5 sm:px-5 md:hidden"
        >
          <p class="text-small text-text-muted">
            {{ data().length }} {{ data().length === 1 ? 'rekord' : 'rekordy' }}
          </p>
        </div>

        <div class="md:hidden">
          @for (row of data(); track trackRow($index, row)) {
            <article class="border-b border-black/5 px-4 py-4 last:border-b-0 sm:px-5">
              <div class="space-y-3">
                @for (column of columns(); track column.id) {
                  <div class="grid grid-cols-[minmax(0,0.88fr)_minmax(0,1fr)] gap-3">
                    <p
                      class="pt-0.5 text-[11px]/5 font-semibold uppercase tracking-[0.18em] text-text-muted"
                    >
                      {{ column.header }}
                    </p>

                    <div [class]="mobileCellClasses(column)">
                      @if (column.type === 'badge') {
                        <ui-badge [variant]="resolveBadgeVariant(column, row)">
                          {{ resolveCellValue(row, column) }}
                        </ui-badge>
                      } @else {
                        <p class="text-label text-text-main">
                          {{ resolveCellValue(row, column) }}
                        </p>
                      }

                      @if (resolveCellDescription(row, column)) {
                        <p class="text-small text-text-muted">
                          {{ resolveCellDescription(row, column) }}
                        </p>
                      }
                    </div>
                  </div>
                }
              </div>
            </article>
          }
        </div>

        <div class="hidden overflow-x-auto md:block">
          <table class="min-w-full border-separate border-spacing-0">
            <thead>
              <tr>
                @for (column of columns(); track column.id) {
                  <th
                    scope="col"
                    [class]="headerClasses(column)"
                    [style.width]="column.width || null"
                  >
                    {{ column.header }}
                  </th>
                }
              </tr>
            </thead>

            <tbody>
              @for (row of data(); track trackRow($index, row)) {
                <tr class="transition duration-200 hover:bg-[rgb(250_252_255/0.95)]">
                  @for (column of columns(); track column.id) {
                    <td [class]="cellClasses(column)">
                      <div [class]="desktopCellContentClasses(column)">
                        @if (column.type === 'badge') {
                          <ui-badge [variant]="resolveBadgeVariant(column, row)">
                            {{ resolveCellValue(row, column) }}
                          </ui-badge>
                        } @else {
                          <p class="text-label text-text-main">
                            {{ resolveCellValue(row, column) }}
                          </p>
                        }

                        @if (resolveCellDescription(row, column)) {
                          <p class="text-small text-text-muted">
                            {{ resolveCellDescription(row, column) }}
                          </p>
                        }
                      </div>
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <div class="px-5 py-10 text-center sm:px-6">
          <div
            class="mx-auto flex max-w-sm flex-col items-center rounded-[1.45rem] border border-dashed border-black/10 bg-[linear-gradient(180deg,_rgb(255_255_255/0.92),_rgb(247_249_252/0.88))] px-6 py-8"
          >
            <div
              class="flex size-11 items-center justify-center rounded-full bg-primary-soft text-primary shadow-[inset_0_1px_0_rgb(255_255_255/0.82)]"
            >
              <svg viewBox="0 0 20 20" fill="none" class="size-5">
                <path
                  d="M4.5 5.5H15.5M4.5 10H15.5M4.5 14.5H10.5"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round"
                />
              </svg>
            </div>
            <p class="mt-4 text-label text-text-main">{{ emptyTitle() }}</p>
            @if (emptyDescription()) {
              <p class="mt-1 text-body text-text-muted">{{ emptyDescription() }}</p>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class UiTableComponent {
  readonly columns = input<UiTableColumn<any>[]>([]);
  readonly data = input<any[]>([]);
  readonly emptyTitle = input('Brak danych do wyswietlenia');
  readonly emptyDescription = input(
    'Po dodaniu rekordow zobaczysz tutaj ich aktualny stan i najwazniejsze szczegoly.',
  );

  protected readonly hasRows = computed(() => this.data().length > 0);

  protected headerClasses(column: UiTableColumn<any>): string {
    return classNames(
      'border-b border-black/6 bg-[rgb(249_251_255/0.92)] px-5 py-3.5 text-[11px]/5 font-semibold uppercase tracking-[0.18em] text-text-muted first:pl-6 last:pr-6',
      DESKTOP_ALIGNMENT_CLASSES[column.align ?? 'start'],
    );
  }

  protected cellClasses(column: UiTableColumn<any>): string {
    return classNames(
      'border-b border-black/5 px-5 py-4 align-top first:pl-6 last:pr-6',
      DESKTOP_ALIGNMENT_CLASSES[column.align ?? 'start'],
    );
  }

  protected desktopCellContentClasses(column: UiTableColumn<any>): string {
    return classNames(
      'flex min-w-0 flex-col gap-1',
      column.align === 'center' && 'items-center',
      column.align === 'end' && 'items-end',
    );
  }

  protected mobileCellClasses(column: UiTableColumn<any>): string {
    return classNames(
      'flex min-w-0 flex-col gap-1',
      MOBILE_ALIGNMENT_CLASSES[column.align ?? 'start'],
    );
  }

  protected resolveCellValue(row: UiTableRow, column: UiTableColumn<any>): string {
    const record = row as Record<string, unknown>;
    const rawValue = column.cell ? column.cell(row) : column.key ? record[column.key] : '';

    return this.stringifyValue(rawValue);
  }

  protected resolveCellDescription(row: UiTableRow, column: UiTableColumn<any>): string {
    return column.description ? this.stringifyValue(column.description(row)) : '';
  }

  protected resolveBadgeVariant(column: UiTableColumn<any>, row: UiTableRow): UiBadgeVariant {
    const value = this.resolveCellValue(row, column);

    if (typeof column.badgeVariant === 'function') {
      return column.badgeVariant(value, row);
    }

    return column.badgeVariant ?? 'neutral';
  }

  protected trackRow(index: number, row: UiTableRow): string | number {
    const rowId = (row as Record<string, unknown>)['id'];

    return typeof rowId === 'string' || typeof rowId === 'number' ? rowId : index;
  }

  private stringifyValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '--';
    }

    if (typeof value === 'string' || typeof value === 'number') {
      return String(value);
    }

    if (typeof value === 'boolean') {
      return value ? 'Tak' : 'Nie';
    }

    if (value instanceof Date) {
      return value.toLocaleDateString('pl-PL');
    }

    return String(value);
  }
}
