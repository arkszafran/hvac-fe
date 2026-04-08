import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { classNames } from '../utils/classnames';

export type UiBadgeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const VARIANT_CLASSES: Record<UiBadgeVariant, string> = {
  neutral: 'border border-border/85 bg-surface text-text-main backdrop-blur-xl',
  info: 'border border-primary/12 bg-primary-soft text-primary-strong',
  success: 'border border-success/14 bg-success-soft text-success',
  warning: 'border border-warning/18 bg-warning-soft text-accent-strong',
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
      'inline-flex items-center rounded-[0.75rem] px-2.5 py-1 text-small font-semibold tracking-[-0.01em]',
      VARIANT_CLASSES[this.variant()],
    ),
  );
}
