import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { UiButtonComponent } from '../../../../ui';
import { classNames } from '../../../../ui/utils/classnames';
import {
  ActionableInspectionConfirmationStatus,
  formatServiceOrderDate,
  formatServiceOrderNextActionDateTime,
} from '../../utils/service-order-ui.util';

export type ServiceOrderInspectionConfirmationVariant = 'details' | 'mobile-list' | 'table';

@Component({
  selector: 'app-service-order-inspection-confirmation',
  imports: [TranslocoPipe, UiButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-order-inspection-confirmation.component.html',
})
export class ServiceOrderInspectionConfirmationComponent {
  private readonly transloco = inject(TranslocoService);
  private readonly activeLanguage = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  readonly status = input.required<ActionableInspectionConfirmationStatus>();
  readonly scheduledAt = input.required<string>();
  readonly reminderSentAt = input('');
  readonly variant = input<ServiceOrderInspectionConfirmationVariant>('details');
  readonly changeRequested = output<void>();
  readonly confirmationRequested = output<void>();

  protected readonly isDetails = computed(() => this.variant() === 'details');
  protected readonly isConfirmed = computed(() => this.status() === 'confirmed');
  protected readonly containerClasses = computed(() =>
    classNames(
      'rounded-field border',
      this.isDetails() ? 'px-4 py-4' : 'px-3 py-2.5',
      this.isConfirmed()
        ? 'border-success/25 bg-success-soft'
        : 'border-warning/25 bg-warning-soft',
    ),
  );

  protected detailTitleKey(): string {
    return this.isConfirmed()
      ? 'serviceOrders.confirmation.confirmedTitle'
      : 'serviceOrders.confirmation.waitingTitle';
  }

  protected compactTitleKey(): string {
    if (this.isConfirmed()) {
      return 'serviceOrders.confirmation.confirmedCompact';
    }

    return this.variant() === 'table'
      ? 'serviceOrders.confirmation.waitingCompact'
      : 'serviceOrders.confirmation.unconfirmedCompact';
  }

  protected formattedDateTime(): string {
    this.activeLanguage();
    const formatted = formatServiceOrderNextActionDateTime(
      this.scheduledAt(),
      this.transloco.getActiveLang(),
    );

    return `${formatted.date}, ${formatted.time}`;
  }

  protected formattedReminderDate(): string {
    this.activeLanguage();
    return formatServiceOrderDate(this.reminderSentAt(), this.transloco.getActiveLang());
  }
}
