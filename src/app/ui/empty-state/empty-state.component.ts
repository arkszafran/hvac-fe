import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

import { UiButtonComponent } from '../button/button.component';

@Component({
  selector: 'ui-empty-state',
  standalone: true,
  imports: [UiButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="rounded-[1.75rem] border border-dashed border-black/8 bg-white/68 px-6 py-12 text-center shadow-card backdrop-blur-xl"
    >
      <div
        class="mx-auto flex size-16 items-center justify-center rounded-[1.4rem] bg-[linear-gradient(135deg,_color-mix(in_oklab,var(--color-primary-soft),white_25%),_color-mix(in_oklab,var(--color-accent-soft),white_15%))] text-primary shadow-[0_18px_34px_-24px_rgb(0_102_255/0.35)]"
      >
        <svg viewBox="0 0 24 24" fill="none" class="size-8">
          <path
            d="M8 7.5H16M8 12H14M9 16.5H15M7.5 4H16.5C18.433 4 20 5.567 20 7.5V16.5C20 18.433 18.433 20 16.5 20H7.5C5.567 20 4 18.433 4 16.5V7.5C4 5.567 5.567 4 7.5 4Z"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>

      <div class="mx-auto mt-5 max-w-md space-y-2">
        <h3 class="text-h2 text-text-main">
          {{ titleText() }}
        </h3>
        <p class="text-body text-text-muted">
          {{ descriptionText() }}
        </p>
      </div>

      @if (actionLabel()) {
        <div class="mt-6 flex justify-center">
          <ui-button variant="secondary" (pressed)="action.emit()">
            {{ actionLabel() }}
          </ui-button>
        </div>
      }
    </section>
  `,
})
export class UiEmptyStateComponent {
  private readonly transloco = inject(TranslocoService);

  readonly title = input('');
  readonly description = input('');
  readonly actionLabel = input('');

  readonly action = output<void>();

  protected titleText(): string {
    return this.title() || this.transloco.translate('ui.emptyState.title');
  }

  protected descriptionText(): string {
    return this.description() || this.transloco.translate('ui.emptyState.description');
  }
}
