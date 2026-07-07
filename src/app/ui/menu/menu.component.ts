import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  booleanAttribute,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';

import { classNames } from '../utils/classnames';

type UiMenuAlign = 'start' | 'end';

const DEFAULT_TRIGGER_CLASS =
  'ui-focus-ring inline-flex min-h-11 items-center justify-center rounded-[0.95rem] border border-border/90 bg-white px-3 text-label font-semibold text-text-main shadow-[0_14px_34px_-24px_rgb(15_23_42/0.22)] backdrop-blur-xl transition hover:border-primary/18 hover:bg-primary-soft/32 active:bg-primary-soft/45';
const DEFAULT_PANEL_CLASS =
  'absolute top-[calc(100%+0.5rem)] z-50 min-w-48 rounded-[0.95rem] border border-border/90 bg-white p-1.5 shadow-[0_24px_48px_-28px_rgb(15_23_42/0.35)]';

let nextMenuId = 0;

@Component({
  selector: 'ui-menu',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './menu.component.html',
  host: {
    class: 'relative inline-flex',
  },
})
export class UiMenuComponent {
  readonly triggerLabel = input.required<string>();
  readonly menuLabel = input<string | null>(null);
  readonly align = input<UiMenuAlign>('end');
  readonly triggerClass = input(DEFAULT_TRIGGER_CLASS);
  readonly panelClass = input(DEFAULT_PANEL_CLASS);
  readonly closeOnMenuClick = input(true, { transform: booleanAttribute });

  protected readonly isOpen = signal(false);
  protected readonly menuId = `ui-menu-${nextMenuId++}`;
  protected readonly menuPanelClasses = computed(() =>
    classNames(this.panelClass(), this.align() === 'end' ? 'right-0' : 'left-0'),
  );

  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly triggerButton = viewChild<ElementRef<HTMLButtonElement>>('triggerButton');

  constructor() {
    const handleDocumentClick = (event: MouseEvent): void => {
      if (!this.isOpen() || this.containsTarget(event.target)) {
        return;
      }

      this.close();
    };
    const handleDocumentKeydown = (event: KeyboardEvent): void => {
      if (!this.isOpen() || event.key !== 'Escape') {
        return;
      }

      event.preventDefault();
      this.close();
      this.focusTrigger();
    };

    this.document.addEventListener('click', handleDocumentClick);
    this.document.addEventListener('keydown', handleDocumentKeydown);
    this.destroyRef.onDestroy(() => {
      this.document.removeEventListener('click', handleDocumentClick);
      this.document.removeEventListener('keydown', handleDocumentKeydown);
    });
  }

  protected toggle(event: MouseEvent): void {
    event.stopPropagation();
    this.isOpen.update((isOpen) => !isOpen);
  }

  protected handleMenuClick(): void {
    if (!this.closeOnMenuClick()) {
      return;
    }

    this.close();
  }

  private close(): void {
    this.isOpen.set(false);
  }

  private containsTarget(target: EventTarget | null): boolean {
    return isNode(target) && this.host.nativeElement.contains(target);
  }

  private focusTrigger(): void {
    this.triggerButton()?.nativeElement.focus();
  }
}

function isNode(value: EventTarget | null): value is Node {
  return typeof Node !== 'undefined' && value instanceof Node;
}
