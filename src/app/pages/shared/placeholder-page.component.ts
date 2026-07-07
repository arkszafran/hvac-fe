import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import {
  UiButtonComponent,
  UiCardComponent,
  UiEmptyStateComponent,
  UiPageHeaderComponent,
} from '../../ui';

@Component({
  selector: 'app-placeholder-page',
  standalone: true,
  imports: [
    TranslocoPipe,
    UiButtonComponent,
    UiCardComponent,
    UiEmptyStateComponent,
    UiPageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <ui-page-header
        [eyebrow]="eyebrow()"
        [title]="title()"
        [description]="description()"
      >
        <ui-button header-action variant="secondary" size="sm">
          {{ 'pages.placeholder.badge' | transloco }}
        </ui-button>
      </ui-page-header>

      <section class="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(280px,0.92fr)]">
        <ui-card>
          <div card-header class="space-y-1">
            <p class="ui-kicker">{{ 'pages.placeholder.readyEyebrow' | transloco }}</p>
            <h2 class="text-h3 tracking-[-0.02em] text-text-main">
              {{ 'pages.placeholder.readyTitle' | transloco }}
            </h2>
          </div>

          <div class="space-y-3">
            @for (item of checklist(); track item) {
              <div
                class="flex items-start gap-3 rounded-[1.35rem] border border-black/6 bg-white/70 px-4 py-3"
              >
                <span
                  class="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary"
                >
                  <svg viewBox="0 0 20 20" fill="none" class="size-4" aria-hidden="true">
                    <path
                      d="M5 10.5L8.2 13.5L15 6.5"
                      stroke="currentColor"
                      stroke-width="1.8"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </span>

                <div class="min-w-0">
                  <p class="text-label text-text-main">{{ item }}</p>
                </div>
              </div>
            }
          </div>

          <div card-footer>
            <p class="text-small text-text-muted">
              {{ 'pages.placeholder.footer' | transloco }}
            </p>
          </div>
        </ui-card>

        <ui-empty-state
          [title]="emptyTitle()"
          [description]="emptyDescription()"
          [actionLabel]="actionLabel()"
        />
      </section>
    </div>
  `,
})
export class AppPlaceholderPageComponent {
  readonly eyebrow = input('');
  readonly title = input('');
  readonly description = input('');
  readonly emptyTitle = input('');
  readonly emptyDescription = input('');
  readonly actionLabel = input('');
  readonly checklist = input<readonly string[]>([]);
}
