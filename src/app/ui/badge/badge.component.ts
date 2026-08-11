import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';

import { classNames } from '../utils/classnames';

export type UiBadgeVariant = 'neutral' | 'info' | 'progress' | 'success' | 'warning' | 'danger';
type UiBadgeSize = 'sm' | 'md';

const SIZE_CLASSES: Record<UiBadgeSize, string> = {
  sm: 'gap-1.5 px-2 py-0.5 text-[0.6875rem]/4',
  md: 'gap-2 px-3 py-1.5 text-label',
};

const VARIANT_CLASSES: Record<UiBadgeVariant, string> = {
  neutral: 'bg-surface-muted text-text-muted',
  info: 'bg-info-soft text-info',
  progress: 'bg-progress-soft text-progress',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
};

@Component({
  selector: 'ui-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="badgeClasses()">
      @if (dot()) {
        <span class="size-1.5 shrink-0 rounded-full bg-current" aria-hidden="true"></span>
      }
      <ng-content />
    </span>
  `,
})
export class UiBadgeComponent {
  readonly variant = input<UiBadgeVariant>('neutral');
  readonly size = input<UiBadgeSize>('md');
  readonly dot = input(false, { transform: booleanAttribute });

  protected readonly badgeClasses = computed(() =>
    classNames(
      'inline-flex items-center rounded-full',
      SIZE_CLASSES[this.size()],
      VARIANT_CLASSES[this.variant()],
    ),
  );
}
