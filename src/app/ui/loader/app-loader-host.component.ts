import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { AppLoaderService } from '../../common/loader/app-loader.service';

@Component({
  selector: 'ui-app-loader-host',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loader.isLoading()) {
      <div
        class="fixed inset-0 z-[120] grid place-items-center bg-slate-950/28 backdrop-blur-[2px]"
        aria-live="polite"
        aria-busy="true"
      >
        <div
          class="grid size-16 place-items-center rounded-[1rem] border border-border/70 bg-white/88 shadow-floating"
        >
          <div
            class="size-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary"
            aria-label="Ladowanie"
            role="status"
          ></div>
        </div>
      </div>
    }
  `,
})
export class UiAppLoaderHostComponent {
  protected readonly loader = inject(AppLoaderService);
}
