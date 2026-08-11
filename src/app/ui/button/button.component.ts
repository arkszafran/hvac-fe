import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  output,
} from '@angular/core';

import { classNames } from '../utils/classnames';

type UiButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';
type UiButtonSize = 'xs' | 'sm' | 'md' | 'lg';
type UiButtonType = 'button' | 'submit' | 'reset';

const VARIANT_CLASSES: Record<UiButtonVariant, string> = {
  primary:
    'border border-brand bg-brand text-white hover:border-primary-strong hover:bg-primary-strong active:scale-[0.985] disabled:border-transparent disabled:bg-surface-muted disabled:text-text-muted',
  accent:
    'border border-action-contrast bg-action-contrast text-white hover:border-action-hover hover:bg-action-hover active:scale-[0.985] disabled:border-transparent disabled:bg-surface-muted disabled:text-text-muted',
  secondary:
    'border border-border bg-surface text-text-main hover:border-action/45 hover:bg-action-soft active:bg-action-soft disabled:border-transparent disabled:bg-surface-muted disabled:text-text-muted',
  ghost:
    'border border-border bg-surface text-text-main hover:border-action/45 hover:bg-action-soft active:bg-action-soft disabled:border-transparent disabled:bg-surface-muted disabled:text-text-muted',
  danger:
    'border border-danger bg-danger text-white hover:brightness-95 active:scale-[0.985] disabled:border-transparent disabled:bg-surface-muted disabled:text-text-muted',
};

const SIZE_CLASSES: Record<UiButtonSize, string> = {
  xs: 'min-h-9 px-2.5 text-small',
  sm: 'min-h-10 px-3.5 text-label',
  md: 'min-h-10 px-4 text-label',
  lg: 'min-h-12 px-5 text-label',
};

const ICON_ONLY_SIZE_CLASSES: Record<UiButtonSize, string> = {
  xs: 'size-9 min-h-9 p-0 text-small',
  sm: 'size-10 min-h-10 p-0 text-label',
  md: 'size-10 min-h-10 p-0 text-label',
  lg: 'size-12 min-h-12 p-0 text-label',
};

@Component({
  selector: 'ui-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [type]="type()"
      [disabled]="disabled()"
      [attr.aria-label]="ariaLabel() || null"
      [class]="buttonClasses()"
      (click)="pressed.emit($event)"
    >
      <span class="inline-flex items-center gap-2">
        <span class="empty:hidden shrink-0 [&_svg]:size-4">
          <ng-content select="[button-icon]" />
        </span>
        <span class="truncate" [class.sr-only]="iconOnly()">
          <ng-content />
        </span>
      </span>
    </button>
  `,
})
export class UiButtonComponent {
  readonly variant = input<UiButtonVariant>('primary');
  readonly size = input<UiButtonSize>('md');
  readonly type = input<UiButtonType>('button');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly block = input(false, { transform: booleanAttribute });
  readonly iconOnly = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input('');

  readonly pressed = output<MouseEvent>();

  protected readonly buttonClasses = computed(() =>
    classNames(
      'ui-focus-ring inline-flex select-none items-center justify-center rounded-button font-semibold transition-colors duration-200 motion-reduce:transition-none disabled:cursor-not-allowed',
      this.iconOnly() ? ICON_ONLY_SIZE_CLASSES[this.size()] : SIZE_CLASSES[this.size()],
      VARIANT_CLASSES[this.variant()],
      this.block() && 'w-full',
    ),
  );
}
