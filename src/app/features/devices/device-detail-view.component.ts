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
import { DeviceFormModalComponent } from '../customers/components/device-form-modal.component';
import { DeviceNextInspectionModalComponent } from '../customers/components/device-next-inspection-modal.component';
import { CustomersStore } from '../customers/data/customers.store';
import { Customer } from '../customers/models/customer.model';
import { DeviceDraft, getDeviceTypeLabel } from '../customers/models/device.model';
import { InspectionCandidatePickerModalComponent } from '../inspections/components/inspection-candidate-picker-modal.component';
import { InspectionLinkProposalModalComponent } from '../inspections/components/inspection-link-proposal-modal.component';
import {
  DeviceUpdateInspectionPlan,
  InspectionDeviceFlowService,
} from '../inspections/data/inspection-device-flow.service';
import { InspectionsStore } from '../inspections/data/inspections.store';
import {
  getInspectionStatusLabel,
  getInspectionStatusVariant,
} from '../inspections/utils/inspection-ui.util';
import { DevicesStore } from './data/devices.store';
import { Device } from './models/device.model';

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
    InspectionLinkProposalModalComponent,
    InspectionCandidatePickerModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8">
      @if (device(); as device) {
        <section class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div class="space-y-1">
            <nav class="flex flex-wrap items-center gap-2 text-[13px]/5 font-semibold text-text-muted">
              <a
                routerLink="/devices"
                class="text-primary-strong underline decoration-primary/35 underline-offset-4 transition hover:text-primary hover:decoration-primary"
              >
                Lista urządzeń
              </a>
              <span aria-hidden="true">/</span>
              <span class="text-text-main">Urządzenie</span>
            </nav>

            <h1 class="text-display tracking-[-0.04em] text-text-main">
              {{ device.brand }} {{ device.model }}
            </h1>
            <p class="text-body text-text-muted">
              {{ getDeviceTypeLabel(device.type) }} - {{ customerTitle(device.customer) }}
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
                  <dt class="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
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
              <p class="ui-kicker">Obsługa przeglądu</p>
              <h2 class="text-h3 tracking-[-0.02em] text-text-main">Status planowania</h2>
            </div>

            @if (activeInspection(); as inspection) {
              <div class="space-y-4">
                <div class="flex flex-wrap items-center gap-3">
                  <ui-badge [variant]="getInspectionStatusVariant(inspection.status)">
                    {{ getInspectionStatusLabel(inspection.status) }}
                  </ui-badge>
                  <span class="text-small text-text-muted">
                    Proces planowania
                  </span>
                </div>

                <div class="rounded-[1rem] border border-border/80 bg-white p-4 shadow-card">
                  <p class="text-label text-text-main">
                    Liczba urządzeń w procesie: {{ inspection.deviceIds.length }}
                  </p>
                  <p class="mt-2 text-small text-text-muted">
                    Szczegóły kontaktu i terminu są prowadzone w powiązanym procesie przeglądu.
                  </p>
                </div>

                <ui-button variant="secondary" size="sm" (pressed)="navigateToInspection(inspection.id)">
                  Otwórz proces przeglądu
                </ui-button>
              </div>
            } @else if (requiresInspectionAttention()) {
              <div class="space-y-3 rounded-[1rem] border border-warning/30 bg-warning-soft px-4 py-4">
                <p class="text-label text-accent-strong">Nie utworzono jeszcze procesu obsługi dla tego terminu.</p>
                <p class="text-body text-text-main">
                  Przeglądy są włączone, ale urządzenie nie należy teraz do żadnego otwartego procesu planowania.
                </p>
                <ui-button variant="secondary" size="sm" (pressed)="navigateToInspections()">
                  Przejdź do planowania
                </ui-button>
              </div>
            } @else {
              <ui-empty-state
                title="Brak procesu planowania"
                description="Przeglądy są wyłączone albo urządzenie nie ma jeszcze ustawionej daty następnego przeglądu."
              />
            }
          </ui-card>
        </section>

        <ui-card>
          <div card-header class="space-y-1">
            <p class="ui-kicker">Instalacja</p>
            <h2 class="text-h3 tracking-[-0.02em] text-text-main">Lokalizacja i notatki</h2>
          </div>

          <div class="space-y-5">
            <dl class="space-y-4">
              @for (item of installationFacts(); track item.label) {
                <div class="border-b border-border/60 pb-4 last:border-b-0 last:pb-0">
                  <dt class="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
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

        @if (pendingUpdatePlan(); as updatePlan) {
          @if (updatePlan.kind === 'single-candidate') {
            <app-inspection-link-proposal-modal
              [open]="true"
              [title]="updatePlan.title"
              [description]="updatePlan.description"
              [customerName]="updatePlan.customerName"
              [deviceName]="updatePlan.deviceName"
              [inspection]="updatePlan.candidate"
              [primaryActionLabel]="updatePlan.primaryActionLabel"
              [secondaryActionLabel]="updatePlan.createActionLabel"
              [cancelLabel]="updatePlan.cancelActionLabel"
              (close)="clearUpdatePlan()"
              (confirm)="confirmUpdateAttach(updatePlan.candidate.id)"
              (createSeparate)="confirmUpdateCreateNewInspection()"
            />
          } @else if (updatePlan.kind === 'candidate-choice') {
            <app-inspection-candidate-picker-modal
              [open]="true"
              [title]="updatePlan.title"
              [description]="updatePlan.description"
              [customerName]="updatePlan.customerName"
              [deviceName]="updatePlan.deviceName"
              [candidates]="updatePlan.candidates"
              [createActionLabel]="updatePlan.createActionLabel"
              [cancelActionLabel]="updatePlan.cancelActionLabel"
              (close)="clearUpdatePlan()"
              (inspectionSelected)="confirmUpdateAttach($event)"
              (createNew)="confirmUpdateCreateNewInspection()"
            />
          }
        }
      } @else {
        <ui-empty-state
          title="Nie znaleźliśmy tego urządzenia"
          description="Sprawdź identyfikator albo wróć do listy urządzeń."
          actionLabel="Wróć do listy urządzeń"
          (action)="navigateToDevices()"
        />
      }
    </div>
  `,
})
export class DeviceDetailViewComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly customersStore = inject(CustomersStore);
  private readonly devicesStore = inject(DevicesStore);
  private readonly inspectionsStore = inject(InspectionsStore);
  private readonly inspectionDeviceFlowService = inject(InspectionDeviceFlowService);

  protected readonly isEditDeviceModalOpen = signal(false);
  protected readonly isNextInspectionModalOpen = signal(false);
  protected readonly pendingUpdateDraft = signal<DeviceDraft | null>(null);
  protected readonly pendingUpdatePlan = signal<DeviceUpdateInspectionPlan | null>(null);
  protected readonly deviceId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('deviceId') ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('deviceId') ?? '' },
  );

  protected readonly device = computed(() => this.devicesStore.getDeviceById(this.deviceId()));
  protected readonly activeInspection = computed(() => {
    const device = this.device();

    return device ? this.inspectionsStore.getActiveInspectionByDeviceId(device.id) : undefined;
  });
  protected readonly requiresInspectionAttention = computed(() => {
    const device = this.device();

    return Boolean(
      device?.hasScheduledInspections && device.nextInspectionDate && !this.activeInspection(),
    );
  });
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

    if (!device) {
      return '--';
    }

    const street = device.hasCustomInstallationAddress ? device.address : device.customer.address;
    const postalCode = device.hasCustomInstallationAddress
      ? device.postalCode
      : device.customer.postalCode;
    const city = device.hasCustomInstallationAddress ? device.city : device.customer.city;
    const cityLine = [postalCode, city].filter(Boolean).join(' ').trim();
    const addressLines = [street, cityLine].filter(Boolean);

    return addressLines.length ? addressLines.join('\n') : '--';
  });

  protected readonly getDeviceTypeLabel = getDeviceTypeLabel;
  protected readonly getInspectionStatusLabel = getInspectionStatusLabel;
  protected readonly getInspectionStatusVariant = getInspectionStatusVariant;

  protected customerTitle(customer: Customer): string {
    return customer.companyName || customer.fullName || 'Klient';
  }

  protected navigateToDevices(): void {
    void this.router.navigate(['/devices']);
  }

  protected navigateToInspection(inspectionId: string): void {
    void this.router.navigate(['/inspections', inspectionId]);
  }

  protected navigateToInspections(): void {
    void this.router.navigate(['/inspections']);
  }

  protected handleUpdateDevice(deviceDraft: DeviceDraft): void {
    this.processDeviceUpdate(deviceDraft);
  }

  protected handleUpdateNextInspectionDate(
    inspectionSettings: Pick<DeviceDraft, 'hasScheduledInspections' | 'nextInspectionDate'>,
  ): void {
    const currentDraft = this.editableDeviceDraft();

    if (!currentDraft) {
      return;
    }

    this.processDeviceUpdate({
      ...currentDraft,
      ...inspectionSettings,
    });
  }

  protected clearUpdatePlan(): void {
    this.pendingUpdateDraft.set(null);
    this.pendingUpdatePlan.set(null);
  }

  protected confirmUpdateCreateNewInspection(): void {
    const plan = this.pendingUpdatePlan();
    const draft = this.pendingUpdateDraft();

    if (!plan || !draft) {
      return;
    }

    this.finishUpdateDevice(plan, draft, { kind: 'create-new' });
  }

  protected confirmUpdateAttach(inspectionId: string): void {
    const plan = this.pendingUpdatePlan();
    const draft = this.pendingUpdateDraft();

    if (!plan || !draft) {
      return;
    }

    this.finishUpdateDevice(plan, draft, { kind: 'attach', inspectionId });
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

  private processDeviceUpdate(deviceDraft: DeviceDraft): void {
    const device = this.device();

    if (!device) {
      return;
    }

    const plan = this.inspectionDeviceFlowService.previewUpdateDevice(
      device.customer,
      device,
      deviceDraft,
    );

    if (plan.kind === 'single-candidate' || plan.kind === 'candidate-choice') {
      this.pendingUpdateDraft.set(deviceDraft);
      this.pendingUpdatePlan.set(plan);
      this.isEditDeviceModalOpen.set(false);
      this.isNextInspectionModalOpen.set(false);
      return;
    }

    this.finishUpdateDevice(plan, deviceDraft);
  }

  private finishUpdateDevice(
    plan: DeviceUpdateInspectionPlan,
    deviceDraft: DeviceDraft,
    choice?: { kind: 'create-new' } | { kind: 'attach'; inspectionId: string },
  ): void {
    const device = this.device();

    if (!device) {
      return;
    }

    const result = this.inspectionDeviceFlowService.commitUpdateDevice(
      device.customer,
      device,
      deviceDraft,
      plan,
      choice,
    );

    if (!result) {
      return;
    }

    this.clearUpdatePlan();
    this.isEditDeviceModalOpen.set(false);
    this.isNextInspectionModalOpen.set(false);
  }

  private formatValue(value: string): string {
    return value.trim() || '--';
  }
}
