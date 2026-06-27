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
type UiButtonSize = 'xs' | 'sm' | 'md' | 'lg';
type UiButtonType = 'button' | 'submit' | 'reset';

const VARIANT_CLASSES: Record<UiButtonVariant, string> = {
  primary:
    'border border-primary-strong/90 bg-[linear-gradient(180deg,_color-mix(in_oklab,var(--color-primary),white_8%)_0%,_var(--color-primary-strong)_100%)] text-white shadow-[0_22px_42px_-24px_rgb(24_74_160/0.6)] hover:-translate-y-0.5 hover:brightness-[1.05] hover:shadow-[0_26px_46px_-24px_rgb(24_74_160/0.66)] active:translate-y-0 active:scale-[0.985] disabled:border-primary/35 disabled:bg-primary/60',
  secondary:
    'border border-border/90 bg-white text-text-main shadow-[0_14px_26px_-24px_rgb(15_23_42/0.38)] backdrop-blur-xl hover:-translate-y-0.5 hover:border-primary/22 hover:bg-primary-soft/45 hover:text-primary-strong active:translate-y-0 active:bg-primary-soft/60',
  ghost:
    'border border-border/75 bg-[linear-gradient(180deg,_rgb(248_250_252/0.96)_0%,_rgb(241_245_249/0.86)_100%)] text-text-main shadow-[0_12px_24px_-24px_rgb(15_23_42/0.48)] hover:-translate-y-0.5 hover:border-primary/18 hover:bg-primary-soft/58 hover:text-primary-strong active:translate-y-0 active:bg-primary-soft/68',
  danger:
    'border border-danger/80 bg-[linear-gradient(180deg,_color-mix(in_oklab,var(--color-danger),white_10%)_0%,_var(--color-danger)_100%)] text-white shadow-[0_20px_38px_-24px_rgb(170_40_40/0.45)] hover:-translate-y-0.5 hover:brightness-[1.04] active:translate-y-0 active:scale-[0.985] disabled:border-danger/35 disabled:bg-danger/60',
};

const SIZE_CLASSES: Record<UiButtonSize, string> = {
  xs: 'min-h-8 px-2.5 text-small',
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
      'ui-focus-ring inline-flex select-none items-center justify-center rounded-[0.95rem] font-semibold tracking-[-0.01em] transition duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none',
      SIZE_CLASSES[this.size()],
      VARIANT_CLASSES[this.variant()],
      this.block() && 'w-full',
    ),
  );
}
