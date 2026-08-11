import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import {
  UiButtonComponent,
  UiIconComponent,
  UiMenuComponent,
  UiModalComponent,
} from '../../../../ui';
import { classNames } from '../../../../ui/utils/classnames';
import { ServiceOrder } from '../../models/service-order.model';

type ServiceOrderActionsContext = 'table' | 'details';

@Component({
  selector: 'app-service-order-actions-menu',
  imports: [TranslocoPipe, UiButtonComponent, UiIconComponent, UiMenuComponent, UiModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-order-actions-menu.component.html',
})
export class ServiceOrderActionsMenuComponent {
  readonly order = input.required<ServiceOrder>();
  readonly context = input<ServiceOrderActionsContext>('table');
  readonly scheduleRequested = output<void>();
  readonly nextContactRequested = output<void>();
  readonly noteRequested = output<void>();
  readonly assigneeRequested = output<void>();
  readonly cancellationRequested = output<void>();

  protected readonly isMobileMenuOpen = signal(false);
  protected readonly desktopContainerClasses = computed(() =>
    this.context() === 'details' ? 'hidden md:block' : 'hidden min-[1200px]:block',
  );
  protected readonly mobileContainerClasses = computed(() =>
    this.context() === 'details' ? 'md:hidden' : 'min-[1200px]:hidden',
  );
  protected readonly desktopTriggerClasses = computed(() =>
    classNames(
      'ui-focus-ring inline-flex items-center justify-center rounded-button border border-border bg-surface text-text-main transition-colors duration-200 hover:border-action/45 hover:bg-action-soft motion-reduce:transition-none',
      this.context() === 'details' ? 'min-h-10 px-4 text-label' : 'size-9',
    ),
  );
  protected readonly canChangeOrder = computed(() => {
    const status = this.order().status;
    return status !== 'completed' && status !== 'cancelled';
  });

  protected requestSchedule(): void {
    this.closeMobileMenu();
    this.scheduleRequested.emit();
  }

  protected requestNextContact(): void {
    this.closeMobileMenu();
    this.nextContactRequested.emit();
  }

  protected requestNote(): void {
    this.closeMobileMenu();
    this.noteRequested.emit();
  }

  protected requestAssignee(): void {
    this.closeMobileMenu();
    this.assigneeRequested.emit();
  }

  protected requestCancellation(): void {
    this.closeMobileMenu();
    this.cancellationRequested.emit();
  }

  protected closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }
}
