import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { APP_PRODUCT_NAME } from '../app-navigation';
import { AppLanguageSwitcherComponent } from '../language-switcher/language-switcher.component';
import { AppLayoutIconComponent } from '../layout-icon/layout-icon.component';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [RouterLink, TranslocoPipe, AppLanguageSwitcherComponent, AppLayoutIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="sticky top-0 z-40 border-b border-border/85 bg-[rgb(250_252_255/0.9)] backdrop-blur-xl">
      <div class="ui-shell flex h-16 items-center justify-between gap-3">
        <div class="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            [attr.aria-label]="'layout.topBar.openMenu' | transloco"
            class="ui-focus-ring inline-flex size-11 items-center justify-center rounded-[0.95rem] border border-border/90 bg-white text-text-main shadow-[0_14px_34px_-24px_rgb(15_23_42/0.3)] backdrop-blur-xl transition hover:border-primary/18 hover:bg-primary-soft/45 hover:text-primary-strong md:hidden"
            (click)="menuRequested.emit()"
          >
            <app-layout-icon name="menu" />
          </button>

          <a routerLink="/dashboard" class="flex min-w-0 items-center gap-3">
            <span
              class="flex size-10 shrink-0 items-center justify-center rounded-[0.95rem] border border-primary/14 bg-[linear-gradient(180deg,_var(--color-primary)_0%,_var(--color-primary-strong)_100%)] text-label font-semibold tracking-[-0.03em] text-white shadow-[0_18px_34px_-24px_rgb(24_74_160/0.46)]"
            >
              H
            </span>

            <span class="min-w-0">
              <span class="block truncate text-label font-semibold tracking-[-0.02em] text-text-main">
                {{ productName }}
              </span>
              <span class="hidden truncate text-small text-text-muted sm:block">
                {{ 'layout.productTagline' | transloco }}
              </span>
            </span>
          </a>
        </div>

        <div class="flex items-center gap-2">
          <app-language-switcher />

          <button
            type="button"
            [attr.aria-label]="'layout.topBar.notifications' | transloco"
            class="ui-focus-ring inline-flex size-11 items-center justify-center rounded-[0.95rem] border border-border/90 bg-white text-text-muted shadow-[0_14px_34px_-24px_rgb(15_23_42/0.22)] backdrop-blur-xl transition hover:border-primary/18 hover:bg-primary-soft/45 hover:text-primary-strong"
          >
            <app-layout-icon name="bell" />
          </button>

          <button
            type="button"
            [attr.aria-label]="'layout.topBar.userProfile' | transloco"
            class="ui-focus-ring inline-flex items-center gap-2 rounded-[1rem] border border-border/90 bg-white px-2.5 py-1.5 shadow-[0_14px_34px_-24px_rgb(15_23_42/0.22)] backdrop-blur-xl transition hover:border-primary/18 hover:bg-primary-soft/32"
          >
            <span
              class="flex size-9 items-center justify-center rounded-[0.8rem] bg-[linear-gradient(180deg,_var(--color-accent)_0%,_var(--color-accent-strong)_100%)] text-small font-semibold tracking-[0.04em] text-white shadow-[0_14px_24px_-18px_rgb(214_121_24/0.44)]"
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
}
