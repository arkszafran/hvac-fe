import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  output,
} from '@angular/core';

import { classNames } from '../utils/classnames';

export interface UiTabItem {
  id: string;
  label: string;
  count?: string | number;
}

@Component({
  selector: 'ui-tabs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="overflow-x-auto">
      <div
        role="tablist"
        class="inline-flex min-w-full gap-1.5 rounded-[1rem] border border-border/85 bg-surface/84 p-1.5 shadow-[inset_0_1px_0_rgb(255_255_255/0.84)] backdrop-blur-xl"
      >
        @for (tab of tabs(); track tab.id) {
          <button
            type="button"
            role="tab"
            [attr.aria-selected]="isActive(tab.id)"
            [class]="tabClasses(tab.id)"
            (click)="selectTab(tab.id)"
          >
            <span>{{ tab.label }}</span>

            @if (tab.count !== undefined) {
              <span [class]="countClasses(tab.id)">
                {{ tab.count }}
              </span>
            }
          </button>
        }
      </div>
    </div>
  `,
})
export class UiTabsComponent {
  readonly tabs = input<UiTabItem[]>([]);
  readonly activeId = input('');
  readonly stretch = input(false, { transform: booleanAttribute });

  readonly activeIdChange = output<string>();

  protected readonly currentActiveId = computed(() => this.activeId() || this.tabs()[0]?.id || '');

  protected isActive(id: string): boolean {
    return this.currentActiveId() === id;
  }

  protected tabClasses(id: string): string {
    return classNames(
      'ui-focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-[0.85rem] border px-4 py-2 text-label font-semibold transition duration-200',
      this.stretch() && 'flex-1',
      this.isActive(id)
        ? 'border-primary/16 bg-white text-primary-strong shadow-[0_12px_24px_-18px_rgb(15_23_42/0.24)]'
        : 'border-transparent text-text-muted hover:border-primary/12 hover:bg-white hover:text-primary-strong',
    );
  }

  protected countClasses(id: string): string {
    return classNames(
      'rounded-[0.65rem] px-2 py-0.5 text-small font-semibold',
      this.isActive(id) ? 'bg-primary-soft text-primary-strong' : 'bg-white/85 text-text-muted',
    );
  }

  protected selectTab(id: string): void {
    if (id !== this.currentActiveId()) {
      this.activeIdChange.emit(id);
    }
  }
}
