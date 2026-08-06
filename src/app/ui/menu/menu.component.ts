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
  protected readonly isOpeningUpward = signal(false);
  protected readonly menuId = `ui-menu-${nextMenuId++}`;
  protected readonly menuPanelClasses = computed(() =>
    classNames(this.panelClass(), this.align() === 'end' ? 'right-0' : 'left-0'),
  );

  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly menuPanel = viewChild<ElementRef<HTMLElement>>('menuPanel');
  private readonly triggerButton = viewChild<ElementRef<HTMLButtonElement>>('triggerButton');
  private placementFrameId: number | undefined;

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
      this.cancelPlacementUpdate();
    });
  }

  protected toggle(event: MouseEvent): void {
    event.stopPropagation();
    const shouldOpen = !this.isOpen();
    this.isOpen.set(shouldOpen);

    if (shouldOpen) {
      this.isOpeningUpward.set(false);
      this.schedulePlacementUpdate();
    }
  }

  protected handleMenuClick(): void {
    if (!this.closeOnMenuClick()) {
      return;
    }

    this.close();
  }

  private close(): void {
    this.isOpen.set(false);
    this.cancelPlacementUpdate();
  }

  private schedulePlacementUpdate(): void {
    const window = this.document.defaultView;

    if (!window) {
      return;
    }

    this.cancelPlacementUpdate();
    this.placementFrameId = window.requestAnimationFrame(() => {
      this.placementFrameId = undefined;
      this.updatePlacement();
    });
  }

  private updatePlacement(): void {
    const panel = this.menuPanel()?.nativeElement;
    const trigger = this.triggerButton()?.nativeElement;
    const window = this.document.defaultView;

    if (!panel || !trigger || !window) {
      return;
    }

    const triggerRect = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    const requiredSpace = panel.offsetHeight + 8;

    this.isOpeningUpward.set(requiredSpace > spaceBelow && spaceAbove > spaceBelow);
  }

  private cancelPlacementUpdate(): void {
    const window = this.document.defaultView;

    if (this.placementFrameId === undefined || !window) {
      return;
    }

    window.cancelAnimationFrame(this.placementFrameId);
    this.placementFrameId = undefined;
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
