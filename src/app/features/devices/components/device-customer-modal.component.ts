import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { UiButtonComponent, UiModalComponent } from '../../../ui';
import { Customer } from '../../customers/models/customer.model';

@Component({
  selector: 'app-device-customer-modal',
  standalone: true,
  imports: [TranslocoPipe, UiButtonComponent, UiModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-modal
      [open]="open()"
      [title]="'devices.customerModal.title' | transloco"
      [description]="'devices.customerModal.description' | transloco"
      (close)="close.emit()"
    >
      @if (customer(); as customer) {
        <div class="space-y-5">
          <section class="space-y-1">
            <p class="text-[11px]/5 font-semibold uppercase tracking-[0.18em] text-text-muted">
              {{ 'devices.customerModal.customer' | transloco }}
            </p>
            <p class="text-[15px]/6 font-semibold tracking-[-0.02em] text-text-main">
              {{ customerTitle(customer) }}
            </p>
            @if (customer.companyName && customer.fullName) {
              <p class="text-[13px]/5 text-text-main/76">{{ customer.fullName }}</p>
            } @else {
              <p class="text-[13px]/5 text-text-main/76">
                {{ (customer.type === 'company' ? 'customers.types.company.shortLabel' : 'customers.types.individual.shortLabel') | transloco }}
              </p>
            }
          </section>

          <div class="grid gap-4 sm:grid-cols-2">
            <section class="space-y-1">
              <p class="text-[11px]/5 font-semibold uppercase tracking-[0.18em] text-text-muted">
                {{ 'devices.customerModal.contact' | transloco }}
              </p>
              <p class="text-label font-medium text-text-main">{{ customer.phone || '--' }}</p>
              <p class="text-small text-text-muted">{{ customer.email || '--' }}</p>
            </section>

            <section class="space-y-1">
              <p class="text-[11px]/5 font-semibold uppercase tracking-[0.18em] text-text-muted">
                {{ 'devices.customerModal.address' | transloco }}
              </p>
              <p class="text-label font-medium text-text-main">{{ customer.address || '--' }}</p>
              <p class="text-small text-text-muted">
                {{ postalAndCity(customer) }}
              </p>
            </section>
          </div>
        </div>
      }

      <div modal-footer class="flex flex-wrap justify-end gap-3">
        <ui-button variant="ghost" (pressed)="navigateToCustomerDevices()">
          {{ 'devices.customerModal.allCustomerDevices' | transloco }}
        </ui-button>
        <ui-button variant="secondary" (pressed)="close.emit()">{{ 'common.actions.close' | transloco }}</ui-button>
      </div>
    </ui-modal>
  `,
})
export class DeviceCustomerModalComponent {
  private readonly router = inject(Router);
  private readonly transloco = inject(TranslocoService);

  readonly open = input(false);
  readonly customer = input<Customer | null>(null);

  readonly close = output<void>();

  protected customerTitle(customer: Customer): string {
    return customer.companyName || customer.fullName || this.transloco.translate('customers.fallbackName');
  }

  protected postalAndCity(customer: Customer): string {
    return `${customer.postalCode || '--'} ${customer.city || ''}`.trim();
  }

  protected navigateToCustomerDevices(): void {
    const customer = this.customer();

    if (!customer) {
      return;
    }

    this.close.emit();
    void this.router.navigate(['/customers', customer.id]);
  }
}
