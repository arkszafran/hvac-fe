import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { UiToast, UiToastVariant } from './toast.model';
import { ToastService } from './toast.service';

const TOAST_CLASSES: Record<UiToastVariant, string> = {
  success: 'border-success/25 bg-success-soft text-success',
  error: 'border-danger/25 bg-danger-soft text-danger',
  info: 'border-primary/20 bg-primary-soft text-primary-strong',
  warning: 'border-warning/25 bg-warning-soft text-accent-strong',
};

const TOAST_TITLES: Record<UiToastVariant, string> = {
  success: 'Gotowe',
  error: 'Wystapil blad',
  info: 'Informacja',
  warning: 'Uwaga',
};

@Component({
  selector: 'ui-toast-host',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      aria-live="polite"
      aria-atomic="false"
      class="pointer-events-none fixed inset-x-0 top-4 z-[110] flex flex-col gap-2 px-3 sm:left-auto sm:right-4 sm:w-[24rem] sm:px-0"
    >
      @for (toast of toastService.toasts(); track toast.id) {
        <article [class]="toastClasses(toast)">
          <div class="min-w-0 space-y-0.5">
            <p class="text-label font-semibold">
              {{ toast.title || fallbackTitle(toast.variant) }}
            </p>
            <p class="text-body text-text-main">
              {{ toast.message }}
            </p>
          </div>

          <button
            type="button"
            class="ui-focus-ring inline-flex size-8 shrink-0 items-center justify-center rounded-full text-current transition hover:bg-white/55"
            aria-label="Zamknij powiadomienie"
            (click)="toastService.dismiss(toast.id)"
          >
            <svg viewBox="0 0 20 20" fill="none" class="size-4" aria-hidden="true">
              <path
                d="M5 5L15 15M15 5L5 15"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </article>
      }
    </div>
  `,
  styles: `
    @keyframes ui-toast-in {
      from {
        opacity: 0;
        transform: translateY(-0.5rem);
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,
})
export class UiToastHostComponent {
  protected readonly toastService = inject(ToastService);

  protected toastClasses(toast: UiToast): string {
    return [
      'pointer-events-auto grid grid-cols-[1fr_auto] gap-3 rounded-[0.9rem] border px-4 py-3 shadow-floating backdrop-blur-xl motion-safe:animate-[ui-toast-in_180ms_ease-out]',
      TOAST_CLASSES[toast.variant],
    ].join(' ');
  }

  protected fallbackTitle(variant: UiToastVariant): string {
    return TOAST_TITLES[variant];
  }
}
