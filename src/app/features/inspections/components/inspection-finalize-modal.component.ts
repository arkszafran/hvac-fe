import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';

import { UiModalComponent } from '../../../ui';
import { Customer } from '../../customers/models/customer.model';
import { Device } from '../../customers/models/device.model';
import { InspectionDetails, InspectionsStore } from '../data/inspections.store';

@Component({
  selector: 'app-inspection-finalize-modal',
  standalone: true,
  imports: [UiModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-modal
      [open]="open() && !!selectedInspection()"
      title="Zakończ przegląd"
      description="Wybierz, jak zamknąć proces planowania przeglądu."
      (close)="handleClose()"
    >
      @if (selectedInspection(); as details) {
        <div class="flex flex-col gap-4">
          <div class="rounded-[1rem] border border-border/80 bg-white px-4 py-4">
            <p class="text-label text-text-main">{{ customerName(details.customer) }}</p>
            <p class="text-small text-text-muted">{{ inspectionAddressSummary(details) }}</p>
            <p class="text-small text-text-muted">
              Urządzenia: {{ details.devices.length }}
            </p>
          </div>

          <div class="grid gap-3">
            <button
              type="button"
              class="ui-focus-ring rounded-[1rem] border border-border/85 bg-white px-4 py-4 text-left transition hover:border-danger/28 hover:bg-danger-soft"
              (click)="cancelInspection()"
            >
              <span class="block text-label text-text-main">Klient zrezygnował z przeglądów</span>
              <span class="block text-small text-text-muted">
                Przegląd otrzyma status anulowany.
              </span>
            </button>

            <button
              type="button"
              class="ui-focus-ring rounded-[1rem] border border-border/85 bg-white px-4 py-4 text-left transition hover:border-primary/28 hover:bg-primary-soft/24"
              (click)="completeInspectionAndCreateVisit()"
            >
              <span class="block text-label text-text-main">Wizyta się odbyła</span>
              <span class="block text-small text-text-muted">
                Przegląd zostanie zakończony, a formularz wizyty otworzy się z wybranym klientem i urządzeniami.
              </span>
            </button>
          </div>
        </div>
      }
    </ui-modal>
  `,
})
export class InspectionFinalizeModalComponent {
  private readonly router = inject(Router);
  private readonly inspectionsStore = inject(InspectionsStore);

  readonly open = input(false);
  readonly inspectionId = input<string | null>(null);

  readonly close = output<void>();

  protected readonly selectedInspection = computed(() => {
    const inspectionId = this.inspectionId();

    return inspectionId
      ? this.inspectionsStore.inspectionDetails().find((details) => details.inspection.id === inspectionId)
      : undefined;
  });

  protected handleClose(): void {
    this.close.emit();
  }

  protected cancelInspection(): void {
    const inspectionId = this.selectedInspection()?.inspection.id;

    if (!inspectionId) {
      return;
    }

    this.inspectionsStore.cancelInspectionAndDisableDeviceInspections(inspectionId);
    this.handleClose();
  }

  protected completeInspectionAndCreateVisit(): void {
    const inspectionId = this.selectedInspection()?.inspection.id;

    if (!inspectionId) {
      return;
    }

    this.inspectionsStore.markCompleted(inspectionId);
    this.handleClose();
    void this.router.navigate(['/visits/new'], {
      queryParams: {
        inspectionId,
      },
    });
  }

  protected inspectionAddressSummary(details: InspectionDetails): string {
    const addresses = Array.from(
      new Set(details.devices.map((device) => this.deviceAddress(details.customer, device))),
    );

    if (!addresses.length) {
      return '--';
    }

    if (addresses.length === 1) {
      return addresses[0];
    }

    return `Adresy: ${addresses.join(' | ')}`;
  }

  protected customerName(customer: Customer): string {
    return customer.companyName || customer.fullName || 'Klient';
  }

  protected deviceAddress(customer: Customer, device: Device): string {
    const street = device.hasCustomInstallationAddress ? device.address : customer.address;
    const cityLine = device.hasCustomInstallationAddress
      ? `${device.postalCode} ${device.city}`.trim()
      : `${customer.postalCode} ${customer.city}`.trim();

    return [street, cityLine].filter(Boolean).join(', ') || '--';
  }
}
