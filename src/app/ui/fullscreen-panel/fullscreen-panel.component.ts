import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';

let nextFullscreenPanelId = 0;

const FOCUSABLE_ELEMENT_SELECTOR = [
  'a[href]:not([tabindex="-1"])',
  'button:not([disabled]):not([tabindex="-1"])',
  'input:not([disabled]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

@Component({
  selector: 'ui-fullscreen-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown)': 'handleDocumentKeydown($event)',
  },
  templateUrl: './fullscreen-panel.component.html',
})
export class UiFullscreenPanelComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly closeButton = viewChild.required<ElementRef<HTMLButtonElement>>('closeButton');
  private readonly previouslyFocusedElement =
    this.document.activeElement instanceof HTMLElement ? this.document.activeElement : null;
  private readonly previousBodyOverflow = this.document.body.style.overflow;

  readonly title = input.required<string>();
  readonly closeLabel = input.required<string>();
  readonly close = output<void>();

  protected readonly titleId = `ui-fullscreen-panel-title-${++nextFullscreenPanelId}`;

  ngOnInit(): void {
    this.document.body.appendChild(this.hostElement);
  }

  ngAfterViewInit(): void {
    this.document.body.style.overflow = 'hidden';
    this.closeButton().nativeElement.focus();
  }

  ngOnDestroy(): void {
    this.document.body.style.overflow = this.previousBodyOverflow;
    this.hostElement.remove();

    window.setTimeout(() => {
      this.previouslyFocusedElement?.focus();
    });
  }

  protected handleDocumentKeydown(event: KeyboardEvent): void {
    if (!this.isTopmostDialog()) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.close.emit();
      return;
    }

    if (event.key === 'Tab') {
      this.keepFocusInsidePanel(event);
    }
  }

  private isTopmostDialog(): boolean {
    const dialogs = this.document.querySelectorAll<HTMLElement>(
      '[role="dialog"][aria-modal="true"]',
    );
    const topmostDialog = dialogs.item(dialogs.length - 1);

    return topmostDialog ? this.hostElement.contains(topmostDialog) : false;
  }

  private keepFocusInsidePanel(event: KeyboardEvent): void {
    const focusableElements = Array.from(
      this.hostElement.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENT_SELECTOR),
    ).filter((element) => element.getClientRects().length > 0);

    if (!focusableElements.length) {
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements.at(-1);
    const activeElement = this.document.activeElement;

    if (event.shiftKey && activeElement === firstElement) {
      event.preventDefault();
      lastElement?.focus();
      return;
    }

    if (!event.shiftKey && activeElement === lastElement) {
      event.preventDefault();
      firstElement?.focus();
    }
  }
}
