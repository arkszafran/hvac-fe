import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type UiCardPadding = 'sm' | 'md' | 'lg';

const PADDING_CLASSES: Record<UiCardPadding, string> = {
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-7',
};

@Component({
  selector: 'ui-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="rounded-card border border-border bg-surface">
      <div class="empty:hidden border-b border-border px-5 py-4 sm:px-6">
        <ng-content select="[card-header]" />
      </div>
      <div [class]="bodyClasses()">
        <ng-content />
      </div>
      <div class="empty:hidden border-t border-border px-5 py-4 sm:px-6">
        <ng-content select="[card-footer]" />
      </div>
    </section>
  `,
})
export class UiCardComponent {
  readonly padding = input<UiCardPadding>('md');

  protected readonly bodyClasses = computed(() => PADDING_CLASSES[this.padding()]);
}
