import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  output,
} from '@angular/core';

import { UiBadgeComponent } from '../badge/badge.component';
import type { UiBadgeVariant } from '../badge/badge.component';
import { classNames } from '../utils/classnames';

export type UiTableRow = object;
export type UiTableAlign = 'start' | 'center' | 'end';
export type UiTableColumnType = 'text' | 'badge';
export type UiTableCellTone = 'default' | 'primary';

export interface UiTableColumn<T extends UiTableRow = UiTableRow> {
  id: string;
  header: string;
  key?: keyof T & string;
  cell?: (row: T) => string;
  eyebrow?: (row: T) => string;
  description?: (row: T) => string;
  align?: UiTableAlign;
  type?: UiTableColumnType;
  width?: string;
  tone?: UiTableCellTone;
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
    <div class="overflow-hidden rounded-[1.1rem] border border-border/90 bg-white shadow-card">
      @if (hasRows()) {
        <div class="md:hidden">
          @for (row of data(); track trackRow($index, row)) {
            <article
              [class]="mobileRowClasses()"
              [attr.role]="rowClickable() ? 'button' : null"
              [attr.tabindex]="rowClickable() ? '0' : null"
              [attr.aria-label]="rowClickable() ? rowActionLabel() : null"
              (click)="handleRowSelect(row, $event)"
              (keydown)="handleRowKeydown($event, row)"
            >
              <div class="space-y-3">
                @for (column of columns(); track column.id) {
                  <div class="grid grid-cols-[5.25rem_minmax(0,1fr)] gap-x-3.5 gap-y-1 sm:grid-cols-[5.75rem_minmax(0,1fr)]">
                    <p
                      class="pr-2 pt-0.5 text-[10px]/4 font-semibold uppercase tracking-[0.14em] text-text-muted"
                    >
                      {{ column.header }}
                    </p>

                    <div [class]="mobileCellClasses(column)">
                      @if (column.type === 'badge') {
                        <ui-badge [variant]="resolveBadgeVariant(column, row)">
                          {{ resolveCellValue(row, column) }}
                        </ui-badge>
                      } @else {
                        @if (resolveCellEyebrow(row, column)) {
                          <p class="text-[10px]/4 font-semibold uppercase tracking-[0.18em] text-primary/70">
                            {{ resolveCellEyebrow(row, column) }}
                          </p>
                        }

                        <p [class]="cellValueClasses(column)">
                          {{ resolveCellValue(row, column) }}
                        </p>
                      }

                      @if (resolveCellDescription(row, column)) {
                        <p [class]="cellDescriptionClasses(column)">
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

            <tbody class="[&_tr:last-child_td]:border-b-0">
              @for (row of data(); track trackRow($index, row)) {
                <tr
                  [class]="desktopRowClasses()"
                  [attr.role]="rowClickable() ? 'button' : null"
                  [attr.tabindex]="rowClickable() ? '0' : null"
                  [attr.aria-label]="rowClickable() ? rowActionLabel() : null"
                  (click)="handleRowSelect(row, $event)"
                  (keydown)="handleRowKeydown($event, row)"
                >
                  @for (column of columns(); track column.id) {
                    <td [class]="cellClasses(column)">
                      <div [class]="desktopCellContentClasses(column)">
                        @if (column.type === 'badge') {
                          <ui-badge [variant]="resolveBadgeVariant(column, row)">
                            {{ resolveCellValue(row, column) }}
                          </ui-badge>
                        } @else {
                          @if (resolveCellEyebrow(row, column)) {
                            <p class="text-[10px]/4 font-semibold uppercase tracking-[0.18em] text-primary/70">
                              {{ resolveCellEyebrow(row, column) }}
                            </p>
                          }

                          <p [class]="cellValueClasses(column)">
                            {{ resolveCellValue(row, column) }}
                          </p>
                        }

                        @if (resolveCellDescription(row, column)) {
                          <p [class]="cellDescriptionClasses(column)">
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
            class="mx-auto flex max-w-sm flex-col items-center rounded-[1rem] border border-dashed border-border/90 bg-[linear-gradient(180deg,_rgb(255_255_255/0.96),_rgb(247_249_252/0.9))] px-6 py-8"
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
  readonly rowClickable = input(false, { transform: booleanAttribute });
  readonly rowActionLabel = input('Otwórz szczegóły rekordu');
  readonly emptyTitle = input('Brak danych do wyświetlenia');
  readonly emptyDescription = input(
    'Po dodaniu rekordów zobaczysz tutaj ich aktualny stan i najważniejsze szczegóły.',
  );

  readonly rowSelected = output<any>();

  protected readonly hasRows = computed(() => this.data().length > 0);

  protected headerClasses(column: UiTableColumn<any>): string {
    return classNames(
      'border-b border-border/90 bg-[linear-gradient(180deg,_rgb(247_250_255/0.96),_rgb(238_244_255/0.94))] px-5 py-4 text-[11px]/5 font-semibold uppercase tracking-[0.18em] text-text-muted first:pl-6 last:pr-6',
      DESKTOP_ALIGNMENT_CLASSES[column.align ?? 'start'],
    );
  }

  protected mobileRowClasses(): string {
    return classNames(
      'border-b border-border/80 px-4 py-4 transition-colors duration-200 last:border-b-0 sm:px-5',
      this.rowClickable() &&
        'ui-focus-ring cursor-pointer hover:bg-primary-soft/28 focus-visible:bg-primary-soft/34',
    );
  }

  protected desktopRowClasses(): string {
    return classNames(
      'group/row transition duration-200',
      this.rowClickable() &&
        'ui-focus-ring cursor-pointer hover:bg-primary-soft/18 focus-visible:bg-primary-soft/22',
    );
  }

  protected cellClasses(column: UiTableColumn<any>): string {
    return classNames(
      'border-b border-border/80 bg-white px-5 py-4.5 align-top transition-colors duration-200 first:pl-6 first:border-l-2 first:border-l-transparent last:pr-6 group-hover/row:bg-primary-soft/30 group-hover/row:first:border-l-primary/55',
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

  protected cellValueClasses(column: UiTableColumn<any>): string {
    return classNames(
      column.tone === 'primary'
        ? 'text-[15px]/6 font-semibold tracking-[-0.02em] text-text-main [overflow-wrap:anywhere]'
        : 'text-label font-medium text-text-main [overflow-wrap:anywhere]',
      column.align === 'center' && 'text-center',
      column.align === 'end' && 'text-right',
    );
  }

  protected cellDescriptionClasses(column: UiTableColumn<any>): string {
    return classNames(
      column.tone === 'primary'
        ? 'text-[13px]/5 text-text-main/76 [overflow-wrap:anywhere]'
        : 'text-small text-text-muted [overflow-wrap:anywhere]',
      column.align === 'center' && 'text-center',
      column.align === 'end' && 'text-right',
    );
  }

  protected resolveCellValue(row: UiTableRow, column: UiTableColumn<any>): string {
    const record = row as Record<string, unknown>;
    const rawValue = column.cell ? column.cell(row) : column.key ? record[column.key] : '';

    return this.stringifyValue(rawValue);
  }

  protected resolveCellEyebrow(row: UiTableRow, column: UiTableColumn<any>): string {
    return column.eyebrow ? this.stringifyValue(column.eyebrow(row)) : '';
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

  protected handleRowSelect(row: UiTableRow, event: Event): void {
    if (
      !this.rowClickable() ||
      this.isInteractiveTarget(event.target, event.currentTarget as HTMLElement | null)
    ) {
      return;
    }

    this.rowSelected.emit(row);
  }

  protected handleRowKeydown(event: KeyboardEvent, row: UiTableRow): void {
    if (!this.rowClickable()) {
      return;
    }

    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    this.rowSelected.emit(row);
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

  private isInteractiveTarget(
    target: EventTarget | null,
    currentTarget: HTMLElement | null,
  ): boolean {
    if (!(target instanceof HTMLElement)) {
      return false;
    }

    const interactiveElement = target.closest(
      'button, a, input, select, textarea, summary, [role="button"]',
    );

    return Boolean(interactiveElement && interactiveElement !== currentTarget);
  }
}
