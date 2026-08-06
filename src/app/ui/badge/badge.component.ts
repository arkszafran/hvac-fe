import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';

import { classNames } from '../utils/classnames';

export type UiBadgeVariant = 'neutral' | 'info' | 'progress' | 'success' | 'warning' | 'danger';

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
  readonly dot = input(false, { transform: booleanAttribute });

  protected readonly badgeClasses = computed(() =>
    classNames(
      'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-label',
      VARIANT_CLASSES[this.variant()],
    ),
  );
}
