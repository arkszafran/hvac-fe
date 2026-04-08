import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-page-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      class="flex flex-col gap-5 rounded-[1.2rem] border border-border/85 bg-[linear-gradient(135deg,_rgb(255_255_255/0.98),_rgb(243_247_255/0.92))] px-5 py-5 shadow-[inset_0_1px_0_rgb(255_255_255/0.82)] sm:flex-row sm:items-end sm:justify-between sm:px-6"
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
