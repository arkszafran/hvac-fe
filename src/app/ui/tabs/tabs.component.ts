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
        class="inline-flex min-w-full gap-1.5 rounded-[1.45rem] border border-white/70 bg-white/58 p-1.5 shadow-[inset_0_1px_0_rgb(255_255_255/0.82)] backdrop-blur-xl"
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
      'ui-focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-4 py-2 text-label transition duration-200',
      this.stretch() && 'flex-1',
      this.isActive(id)
        ? 'bg-white text-text-main shadow-[0_10px_24px_-18px_rgb(15_23_42/0.45)]'
        : 'text-text-muted hover:bg-white/72 hover:text-text-main',
    );
  }

  protected countClasses(id: string): string {
    return classNames(
      'rounded-full px-2 py-0.5 text-small font-medium',
      this.isActive(id) ? 'bg-primary-soft text-primary' : 'bg-white/85 text-text-muted',
    );
  }

  protected selectTab(id: string): void {
    if (id !== this.currentActiveId()) {
      this.activeIdChange.emit(id);
    }
  }
}
