import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  booleanAttribute,
  input,
  output,
} from '@angular/core';

let nextModalId = 0;

@Component({
  selector: 'ui-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-50">
        <button
          type="button"
          aria-label="Zamknij modal"
          class="absolute inset-0 bg-slate-950/42 backdrop-blur-[2px] motion-safe:animate-[ui-fade-in_180ms_ease-out]"
          (click)="handleBackdropClick()"
        ></button>

        <div class="absolute inset-0 flex items-end p-3 sm:p-4 md:items-center md:justify-center">
          <section
            role="dialog"
            aria-modal="true"
            [attr.aria-labelledby]="title() ? titleId : null"
            class="relative w-full overflow-hidden rounded-t-3xl border border-border bg-surface shadow-floating motion-safe:animate-[ui-sheet-up_220ms_cubic-bezier(0.16,1,0.3,1)] md:max-w-xl md:rounded-3xl md:motion-safe:animate-[ui-modal-pop_220ms_cubic-bezier(0.16,1,0.3,1)]"
          >
            @if (title() || description()) {
              <div
                class="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6"
              >
                <div class="space-y-1">
                  @if (title()) {
                    <h2 [id]="titleId" class="text-h2 text-text-main">
                      {{ title() }}
                    </h2>
                  }

                  @if (description()) {
                    <p class="text-body text-text-muted">
                      {{ description() }}
                    </p>
                  }
                </div>

                <button
                  type="button"
                  class="ui-focus-ring inline-flex size-10 items-center justify-center rounded-full text-text-muted transition hover:bg-surface-muted hover:text-text-main"
                  (click)="close.emit()"
                >
                  <svg viewBox="0 0 20 20" fill="none" class="size-4">
                    <path
                      d="M5 5L15 15M15 5L5 15"
                      stroke="currentColor"
                      stroke-width="1.7"
                      stroke-linecap="round"
                    />
                  </svg>
                </button>
              </div>
            }

            <div class="p-5 sm:p-6">
              <ng-content />
            </div>

            <div class="empty:hidden border-t border-border px-5 py-4 sm:px-6">
              <ng-content select="[modal-footer]" />
            </div>
          </section>
        </div>
      </div>
    }
  `,
})
export class UiModalComponent {
  readonly open = input(false, { transform: booleanAttribute });
  readonly title = input('');
  readonly description = input('');
  readonly closeOnBackdrop = input(true, { transform: booleanAttribute });

  readonly close = output<void>();

  protected readonly titleId = `ui-modal-title-${++nextModalId}`;

  @HostListener('document:keydown.escape')
  protected handleEscape(): void {
    if (this.open()) {
      this.close.emit();
    }
  }

  protected handleBackdropClick(): void {
    if (this.closeOnBackdrop()) {
      this.close.emit();
    }
  }
}
