import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  output,
} from '@angular/core';

import { classNames } from '../utils/classnames';

type UiButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type UiButtonSize = 'sm' | 'md' | 'lg';
type UiButtonType = 'button' | 'submit' | 'reset';

const VARIANT_CLASSES: Record<UiButtonVariant, string> = {
  primary:
    'border border-primary/80 bg-[linear-gradient(180deg,_color-mix(in_oklab,var(--color-primary),white_10%)_0%,_var(--color-primary)_100%)] text-white shadow-[0_18px_36px_-20px_rgb(0_102_255/0.6)] hover:bg-primary-strong hover:brightness-[1.03] active:scale-[0.99] disabled:border-primary/40 disabled:bg-primary/60',
  secondary:
    'border border-black/6 bg-white/84 text-text-main shadow-[0_12px_26px_-24px_rgb(15_23_42/0.5)] backdrop-blur-xl hover:border-black/10 hover:bg-white active:bg-surface-muted/90',
  ghost:
    'border border-transparent bg-transparent text-text-main hover:bg-white/70 hover:text-text-main active:bg-surface-muted/90',
  danger:
    'border border-danger/70 bg-[linear-gradient(180deg,_color-mix(in_oklab,var(--color-danger),white_10%)_0%,_var(--color-danger)_100%)] text-white shadow-[0_18px_36px_-24px_rgb(170_40_40/0.45)] hover:brightness-[1.03] active:scale-[0.99] disabled:border-danger/35 disabled:bg-danger/60',
};

const SIZE_CLASSES: Record<UiButtonSize, string> = {
  sm: 'min-h-10 px-3.5 text-label',
  md: 'min-h-11 px-4.5 text-label',
  lg: 'min-h-12 px-5.5 text-label',
};

@Component({
  selector: 'ui-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [type]="type()"
      [disabled]="disabled()"
      [class]="buttonClasses()"
      (click)="pressed.emit($event)"
    >
      <span class="inline-flex items-center gap-2">
        <span class="empty:hidden shrink-0 [&_svg]:size-4">
          <ng-content select="[button-icon]" />
        </span>
        <span class="truncate">
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

  readonly pressed = output<MouseEvent>();

  protected readonly buttonClasses = computed(() =>
    classNames(
      'ui-focus-ring inline-flex select-none items-center justify-center rounded-full font-medium tracking-[-0.01em] transition duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none',
      SIZE_CLASSES[this.size()],
      VARIANT_CLASSES[this.variant()],
      this.block() && 'w-full',
    ),
  );
}
