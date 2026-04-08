import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-page-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      class="flex flex-col gap-5 border-b border-black/6 pb-7 sm:flex-row sm:items-end sm:justify-between"
    >
      <div class="max-w-3xl space-y-3">
        @if (eyebrow()) {
          <p class="ui-kicker">{{ eyebrow() }}</p>
        }

        <div class="space-y-3">
          <h1 class="text-display tracking-[-0.035em] text-text-main">
            {{ title() }}
          </h1>

          @if (description()) {
            <p class="max-w-2xl text-body-lg text-text-muted">
              {{ description() }}
            </p>
          }
        </div>
      </div>

      <div class="empty:hidden flex shrink-0 items-center gap-3">
        <ng-content select="[header-action]" />
      </div>
    </header>
  `,
})
export class UiPageHeaderComponent {
  readonly eyebrow = input('');
  readonly title = input('');
  readonly description = input('');
}
