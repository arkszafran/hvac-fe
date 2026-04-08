import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { classNames } from '../utils/classnames';

export type UiBadgeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const VARIANT_CLASSES: Record<UiBadgeVariant, string> = {
  neutral: 'border border-black/6 bg-white/78 text-text-main backdrop-blur-xl',
  info: 'border border-info/12 bg-info-soft text-info',
  success: 'border border-success/12 bg-success-soft text-success',
  warning: 'border border-warning/16 bg-warning-soft text-[#8C6200]',
  danger: 'border border-danger/12 bg-danger-soft text-danger',
};

@Component({
  selector: 'ui-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="badgeClasses()">
      <ng-content />
    </span>
  `,
})
export class UiBadgeComponent {
  readonly variant = input<UiBadgeVariant>('neutral');

  protected readonly badgeClasses = computed(() =>
    classNames(
      'inline-flex items-center rounded-full px-3 py-1 text-small font-medium tracking-[-0.01em]',
      VARIANT_CLASSES[this.variant()],
    ),
  );
}
