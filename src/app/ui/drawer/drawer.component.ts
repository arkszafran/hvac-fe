import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  booleanAttribute,
  inject,
  input,
  output,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

let nextDrawerId = 0;

@Component({
  selector: 'ui-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-[80]">
        <button
          type="button"
          aria-label="Zamknij panel"
          class="absolute inset-0 bg-slate-950/38 backdrop-blur-[2px] motion-safe:animate-[ui-fade-in_180ms_ease-out]"
          (click)="handleBackdropClick()"
        ></button>

        <section
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="title() ? titleId : null"
          class="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-hidden rounded-t-3xl border border-border bg-surface shadow-floating motion-safe:animate-[ui-sheet-up_220ms_cubic-bezier(0.16,1,0.3,1)] lg:inset-y-0 lg:right-0 lg:left-auto lg:h-full lg:max-h-none lg:w-full lg:max-w-md lg:rounded-none lg:rounded-l-3xl lg:motion-safe:animate-[ui-drawer-in_220ms_cubic-bezier(0.16,1,0.3,1)]"
        >
          <div class="px-5 pt-3 sm:px-6 lg:hidden">
            <div class="mx-auto h-1.5 w-14 rounded-full bg-border"></div>
          </div>

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

          <div
            class="max-h-[calc(85vh-86px)] overflow-y-auto p-5 sm:p-6 lg:max-h-[calc(100vh-86px)]"
          >
            <ng-content />
          </div>

          <div class="empty:hidden border-t border-border px-5 py-4 sm:px-6">
            <ng-content select="[drawer-footer]" />
          </div>
        </section>
      </div>
    }
  `,
})
export class UiDrawerComponent implements OnInit, OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly hostElement = inject(ElementRef<HTMLElement>).nativeElement;

  readonly open = input(false, { transform: booleanAttribute });
  readonly title = input('');
  readonly description = input('');
  readonly closeOnBackdrop = input(true, { transform: booleanAttribute });

  readonly close = output<void>();

  protected readonly titleId = `ui-drawer-title-${++nextDrawerId}`;

  ngOnInit(): void {
    this.document.body.appendChild(this.hostElement);
  }

  ngOnDestroy(): void {
    this.hostElement.remove();
  }

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
