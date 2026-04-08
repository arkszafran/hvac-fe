import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { APP_PRODUCT_NAME, APP_PRODUCT_TAGLINE } from '../app-navigation';
import { AppLayoutIconComponent } from '../layout-icon/layout-icon.component';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [RouterLink, AppLayoutIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="sticky top-0 z-40 border-b border-black/6 bg-[rgb(251_252_254/0.82)] backdrop-blur-xl">
      <div class="ui-shell flex h-16 items-center justify-between gap-3">
        <div class="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            aria-label="Otworz menu"
            class="ui-focus-ring inline-flex size-11 items-center justify-center rounded-full border border-black/6 bg-white/86 text-text-main shadow-[0_14px_34px_-24px_rgb(15_23_42/0.42)] backdrop-blur-xl transition hover:bg-white md:hidden"
            (click)="menuRequested.emit()"
          >
            <app-layout-icon name="menu" />
          </button>

          <a routerLink="/dashboard" class="flex min-w-0 items-center gap-3">
            <span
              class="flex size-10 shrink-0 items-center justify-center rounded-[1.15rem] bg-[linear-gradient(135deg,_color-mix(in_oklab,var(--color-primary-soft),white_18%),_white)] text-label font-semibold tracking-[-0.03em] text-primary shadow-[0_18px_34px_-24px_rgb(0_102_255/0.34)]"
            >
              H
            </span>

            <span class="min-w-0">
              <span class="block truncate text-label font-semibold tracking-[-0.02em] text-text-main">
                {{ productName }}
              </span>
              <span class="hidden truncate text-small text-text-muted sm:block">
                {{ productTagline }}
              </span>
            </span>
          </a>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            aria-label="Powiadomienia"
            class="ui-focus-ring inline-flex size-11 items-center justify-center rounded-full border border-black/6 bg-white/74 text-text-muted shadow-[0_14px_34px_-24px_rgb(15_23_42/0.32)] backdrop-blur-xl transition hover:bg-white hover:text-text-main"
          >
            <app-layout-icon name="bell" />
          </button>

          <button
            type="button"
            aria-label="Profil uzytkownika"
            class="ui-focus-ring inline-flex items-center gap-2 rounded-full border border-black/6 bg-white/86 px-2.5 py-1.5 shadow-[0_14px_34px_-24px_rgb(15_23_42/0.32)] backdrop-blur-xl transition hover:bg-white"
          >
            <span
              class="flex size-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,_color-mix(in_oklab,var(--color-accent-soft),white_18%),_white)] text-small font-semibold tracking-[0.04em] text-accent"
            >
              AK
            </span>
            <span class="hidden text-label text-text-main md:block">Anna</span>
          </button>
        </div>
      </div>
    </header>
  `,
})
export class AppTopBarComponent {
  readonly menuRequested = output<void>();

  protected readonly productName = APP_PRODUCT_NAME;
  protected readonly productTagline = APP_PRODUCT_TAGLINE;
}
