import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';

import {
  UiBadgeComponent,
  UiButtonComponent,
  UiCardComponent,
  UiEmptyStateComponent,
} from '../../ui';
import { DeviceFormModalComponent } from './components/device-form-modal.component';
import { DeviceNextInspectionModalComponent } from './components/device-next-inspection-modal.component';
import { CustomersStore } from './data/customers.store';
import { Customer } from './models/customer.model';
import { DeviceDraft, getDeviceTypeLabel } from './models/device.model';

interface DeviceDetailItem {
  label: string;
  value: string;
}

@Component({
  selector: 'app-device-detail-view',
  standalone: true,
  imports: [
    RouterLink,
    UiBadgeComponent,
    UiButtonComponent,
    UiCardComponent,
    UiEmptyStateComponent,
    DeviceFormModalComponent,
    DeviceNextInspectionModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8">
      @if (customer(); as customer) {
        @if (device(); as device) {
          <section class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div class="space-y-1">
              <nav class="flex flex-wrap items-center gap-2 text-[13px]/5 font-semibold text-text-muted">
                <a
                  routerLink="/customers"
                  class="text-primary-strong underline decoration-primary/35 underline-offset-4 transition hover:text-primary hover:decoration-primary"
                >
                  Lista klientów
                </a>
                <span aria-hidden="true">/</span>
                <a
                  [routerLink]="['/customers', customer.id]"
                  class="text-primary-strong underline decoration-primary/35 underline-offset-4 transition hover:text-primary hover:decoration-primary"
                >
                  Klient: {{ customerTitle(customer) }}
                </a>
                <span aria-hidden="true">/</span>
                <span class="text-text-main">Urządzenie</span>
              </nav>

              <h1 class="text-display tracking-[-0.04em] text-text-main">
                {{ device.brand }} {{ device.model }}
              </h1>
              <p class="text-body text-text-muted">
                {{ getDeviceTypeLabel(device.type) }} - {{ customerTitle(customer) }}
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-3">
              <ui-button size="sm" (pressed)="isEditDeviceModalOpen.set(true)">
                Edytuj urządzenie
              </ui-button>
            </div>
          </section>

          <section class="grid gap-4 xl:grid-cols-[minmax(0,1.18fr)_minmax(320px,0.82fr)]">
            <ui-card>
              <div card-header class="space-y-1">
                <p class="ui-kicker">Dane urządzenia</p>
                <h2 class="text-h3 tracking-[-0.02em] text-text-main">Najważniejsze informacje</h2>
              </div>

              <dl class="grid gap-3 sm:grid-cols-2">
                @for (item of deviceOverviewItems(); track item.label) {
                  <div class="rounded-[1rem] bg-surface/52 px-4 py-3">
                    <dt
                      class="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted"
                    >
                      {{ item.label }}
                    </dt>
                    <dd
                      class="mt-2 rounded-[0.95rem] bg-white px-3.5 py-2 text-body font-semibold text-text-main shadow-[0_10px_20px_-18px_rgb(15_23_42/0.5)]"
                    >
                      {{ item.value }}
                    </dd>
                  </div>
                }

                <div class="rounded-[1rem] bg-surface/52 px-4 py-3 sm:col-span-2">
                  <div class="flex items-start justify-between gap-3">
                    <dt class="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                      Następny przegląd
                    </dt>

                    <button
                      type="button"
                      class="ui-focus-ring rounded-md text-[13px]/5 font-semibold text-primary-strong transition hover:text-primary"
                      (click)="isNextInspectionModalOpen.set(true)"
                    >
                      Zarządzaj przeglądami
                    </button>
                  </div>

                  <dd
                    class="mt-2 rounded-[0.95rem] bg-white px-3.5 py-2 text-body font-semibold text-text-main shadow-[0_10px_20px_-18px_rgb(15_23_42/0.5)]"
                  >
                    {{ nextInspectionDateLabel() }}
                  </dd>
                  <p class="mt-2 text-small text-text-muted">
                    {{ nextInspectionStatusLabel() }}
                  </p>
                </div>
              </dl>
            </ui-card>

            <ui-card>
              <div card-header class="space-y-1">
                <p class="ui-kicker">Instalacja</p>
                <h2 class="text-h3 tracking-[-0.02em] text-text-main">Lokalizacja i notatki</h2>
              </div>

              <div class="space-y-5">
                <dl class="space-y-4">
                  @for (item of installationFacts(); track item.label) {
                    <div class="border-b border-border/60 pb-4 last:border-b-0 last:pb-0">
                      <dt
                        class="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted"
                      >
                        {{ item.label }}
                      </dt>
                      <dd
                        class="mt-2 whitespace-pre-line rounded-[0.95rem] bg-white px-3.5 py-2 text-body font-semibold text-text-main shadow-[0_10px_20px_-18px_rgb(15_23_42/0.5)]"
                      >
                        {{ item.value }}
                      </dd>
                    </div>
                  }
                </dl>

                <div class="rounded-[1.15rem] border border-border/70 bg-surface/56 px-4 py-4">
                  <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                    Notatka
                  </p>
                  <p
                    class="mt-2 rounded-[0.95rem] bg-white px-3.5 py-3 text-body font-semibold text-text-main shadow-[0_10px_20px_-18px_rgb(15_23_42/0.5)]"
                  >
                    {{ device.note || 'Brak dodatkowej notatki do tego urządzenia.' }}
                  </p>
                </div>
              </div>
            </ui-card>
          </section>

          <ui-card>
            <div card-header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 class="text-h3 tracking-[-0.02em] text-text-main">Historia serwisu</h2>
              <ui-badge variant="info">{{ device.serviceHistory.length }} wpisy</ui-badge>
            </div>

            @if (device.serviceHistory.length) {
              <div class="space-y-3">
                @for (entry of device.serviceHistory; track entry.id) {
                  <article class="rounded-[1rem] border border-border/80 bg-white/76 px-4 py-3">
                    <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p class="text-label text-text-main">{{ entry.title }}</p>
                        <p class="text-small text-text-muted">{{ entry.technician }}</p>
                      </div>
                      <p class="text-small text-text-muted">{{ formatDate(entry.date) }}</p>
                    </div>

                    <p class="mt-2 text-body text-text-main">{{ entry.note }}</p>
                  </article>
                }
              </div>
            } @else {
              <ui-empty-state
                title="Brak historii serwisu"
                description="Po wykonaniu pierwszych wizyt serwisowych zobaczysz tutaj pełną historię urządzenia."
              />
            }
          </ui-card>

          <app-device-form-modal
            [open]="isEditDeviceModalOpen()"
            [initialValue]="editableDeviceDraft()"
            modalTitle="Edytuj urządzenie"
            submitLabel="Zapisz zmiany"
            (close)="isEditDeviceModalOpen.set(false)"
            (save)="handleUpdateDevice($event)"
          />

          <app-device-next-inspection-modal
            [open]="isNextInspectionModalOpen()"
            [initialEnabled]="device.hasScheduledInspections"
            [initialDate]="device.nextInspectionDate"
            (close)="isNextInspectionModalOpen.set(false)"
            (save)="handleUpdateNextInspectionDate($event)"
          />
        } @else {
          <ui-empty-state
            title="Nie znaleźliśmy tego urządzenia"
            description="Sprawdź identyfikator albo wróć do listy urządzeń klienta."
            actionLabel="Wróć do klienta"
            (action)="navigateToCustomer(customer.id)"
          />
        }
      } @else {
        <ui-empty-state
          title="Nie znaleźliśmy klienta"
          description="Ten profil nie istnieje albo nie ma już przypisanego urządzenia."
          actionLabel="Wróć do listy klientów"
          (action)="navigateToCustomers()"
        />
      }
    </div>
  `,
})
export class DeviceDetailViewComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly customersStore = inject(CustomersStore);

  protected readonly isEditDeviceModalOpen = signal(false);
  protected readonly isNextInspectionModalOpen = signal(false);
  protected readonly customerId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('customerId') ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('customerId') ?? '' },
  );
  protected readonly deviceId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('deviceId') ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('deviceId') ?? '' },
  );

  protected readonly customer = computed(() =>
    this.customersStore.getCustomerById(this.customerId()),
  );
  protected readonly device = computed(() =>
    this.customersStore.getDeviceById(this.customerId(), this.deviceId()),
  );
  protected readonly editableDeviceDraft = computed<DeviceDraft | null>(() => {
    const device = this.device();

    if (!device) {
      return null;
    }

    return {
      type: device.type,
      brand: device.brand,
      model: device.model,
      serialNumber: device.serialNumber,
      installationDate: device.installationDate,
      warrantyMonths: device.warrantyMonths,
      hasScheduledInspections: device.hasScheduledInspections,
      nextInspectionDate: device.nextInspectionDate,
      note: device.note,
      refrigerant: device.refrigerant,
      refrigerantAmount: device.refrigerantAmount,
      location: device.location,
      hasCustomInstallationAddress: device.hasCustomInstallationAddress,
      address: device.address,
      postalCode: device.postalCode,
      city: device.city,
      serviceHistory: [...device.serviceHistory],
    };
  });
  protected readonly deviceOverviewItems = computed<readonly DeviceDetailItem[]>(() => {
    const device = this.device();

    if (!device) {
      return [];
    }

    return [
      {
        label: 'Marka',
        value: this.formatValue(device.brand),
      },
      {
        label: 'Model',
        value: this.formatValue(device.model),
      },
      {
        label: 'Data uruchomienia',
        value: this.formatDate(device.installationDate),
      },
      {
        label: 'Gwarancja do',
        value: this.formatDate(device.warrantyUntil),
      },
      {
        label: 'Numer seryjny',
        value: this.formatValue(device.serialNumber),
      },
      {
        label: 'Czynnik',
        value: this.formatValue(device.refrigerant),
      },
      {
        label: 'Ilość czynnika',
        value: this.formatValue(device.refrigerantAmount),
      },
    ];
  });
  protected readonly nextInspectionDateLabel = computed(() => {
    const device = this.device();

    if (!device?.hasScheduledInspections) {
      return 'Przeglądy wyłączone';
    }

    return device.nextInspectionDate ? this.formatDate(device.nextInspectionDate) : 'Brak terminu';
  });
  protected readonly nextInspectionStatusLabel = computed(() => {
    const device = this.device();

    return device?.hasScheduledInspections
      ? 'Przeglądy są aktywne dla tego urządzenia.'
      : 'Włącz przeglądy, aby ustawić termin kolejnej wizyty.';
  });
  protected readonly installationFacts = computed<readonly DeviceDetailItem[]>(() => {
    const device = this.device();

    if (!device) {
      return [];
    }

    return [
      {
        label: 'Adres instalacji',
        value: this.installationAddress(),
      },
      {
        label: 'Miejsce montażu',
        value: this.formatValue(device.location),
      },
    ];
  });
  protected readonly installationAddress = computed(() => {
    const device = this.device();
    const customer = this.customer();

    if (!device || !customer) {
      return '--';
    }

    const street = device.hasCustomInstallationAddress ? device.address : customer.address;
    const postalCode = device.hasCustomInstallationAddress ? device.postalCode : customer.postalCode;
    const city = device.hasCustomInstallationAddress ? device.city : customer.city;
    const cityLine = [postalCode, city].filter(Boolean).join(' ').trim();
    const addressLines = [street, cityLine].filter(Boolean);

    return addressLines.length ? addressLines.join('\n') : '--';
  });

  protected readonly getDeviceTypeLabel = getDeviceTypeLabel;

  protected customerTitle(customer: Customer): string {
    return customer.companyName || customer.fullName || 'Klient';
  }

  protected navigateToCustomer(customerId: string): void {
    void this.router.navigate(['/customers', customerId]);
  }

  protected navigateToCustomers(): void {
    void this.router.navigate(['/customers']);
  }

  protected handleUpdateDevice(deviceDraft: DeviceDraft): void {
    this.customersStore.updateDevice(this.customerId(), this.deviceId(), deviceDraft);
    this.isEditDeviceModalOpen.set(false);
  }

  protected handleUpdateNextInspectionDate(
    inspectionSettings: Pick<DeviceDraft, 'hasScheduledInspections' | 'nextInspectionDate'>,
  ): void {
    this.customersStore.updateDeviceInspectionSettings(
      this.customerId(),
      this.deviceId(),
      inspectionSettings,
    );
    this.isNextInspectionModalOpen.set(false);
  }

  protected formatDate(value: string): string {
    if (!value) {
      return '--';
    }

    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('pl-PL').format(parsedDate);
  }

  private formatValue(value: string): string {
    return value.trim() || '--';
  }
}
