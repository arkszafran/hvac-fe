import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { UiButtonComponent, UiMenuComponent, UiModalComponent } from '../../../../ui';
import { ServiceOrder } from '../../models/service-order.model';

@Component({
  selector: 'app-service-order-actions-menu',
  imports: [TranslocoPipe, UiButtonComponent, UiMenuComponent, UiModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-order-actions-menu.component.html',
})
export class ServiceOrderActionsMenuComponent {
  readonly order = input.required<ServiceOrder>();
  readonly scheduleRequested = output<void>();
  readonly nextContactRequested = output<void>();
  readonly noteRequested = output<void>();
  readonly assigneeRequested = output<void>();
  readonly cancellationRequested = output<void>();

  protected readonly isMobileMenuOpen = signal(false);
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
