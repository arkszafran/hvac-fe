import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';

import {
  UiBadgeComponent,
  UiButtonComponent,
  UiCardComponent,
  UiEmptyStateComponent,
  UiModalComponent,
} from '../../ui';
import { Customer } from '../customers/models/customer.model';
import { Device } from '../customers/models/device.model';
import { InspectionScheduleModalComponent } from './components/inspection-schedule-modal.component';
import { InspectionsStore } from './data/inspections.store';
import { InspectionStatus } from './models/inspection.model';
import {
  DEFAULT_INSPECTION_LIST_VIEW_ID,
  buildInspectionListViewQueryParams,
  getInspectionListViewIdForStatus,
  parseInspectionListViewId,
} from './models/inspection-list-view.model';
import { inspectionCanIncludeDate, isDeviceEligibleForInspection } from './utils/inspection-domain.util';
import {
  canCompleteInspection,
  canScheduleInspection,
  formatInspectionDate,
  formatInspectionWindow,
  getInspectionScheduleActionLabel,
  getInspectionStatusLabel,
  getInspectionStatusVariant,
} from './utils/inspection-ui.util';

@Component({
  selector: 'app-inspection-detail-view',
  standalone: true,
  imports: [
    RouterLink,
    UiBadgeComponent,
    UiButtonComponent,
    UiCardComponent,
    UiEmptyStateComponent,
    UiModalComponent,
    InspectionScheduleModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8">
      @if (details(); as details) {
        <section class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div class="space-y-1">
            <nav class="flex flex-wrap items-center gap-2 text-[13px]/5 font-semibold text-text-muted">
              <a
                [routerLink]="['/inspections']"
                [queryParams]="listQueryParams()"
                class="text-primary-strong underline decoration-primary/35 underline-offset-4 transition hover:text-primary hover:decoration-primary"
              >
                Lista przeglądów
              </a>
              <span aria-hidden="true">/</span>
              <span class="text-text-main">{{ customerName(details.customer) }}</span>
            </nav>

            <h1 class="text-display tracking-[-0.04em] text-text-main">
              Przegląd klienta {{ customerName(details.customer) }}
            </h1>
            <p class="text-body text-text-muted">
              {{ formatInspectionWindow(details.inspection.windowStart, details.inspection.windowEnd) }}
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <ui-badge [variant]="getInspectionStatusVariant(details.inspection.status)">
              {{ getInspectionStatusLabel(details.inspection.status) }}
            </ui-badge>
            @if (canSchedule()) {
              <ui-button
                size="sm"
                variant="ghost"
                (pressed)="isScheduleModalOpen.set(true)"
              >
                {{ scheduleActionLabel(details.inspection.status) }}
              </ui-button>
            }
            @if (canComplete()) {
              <ui-button
                size="sm"
                variant="ghost"
                (pressed)="markCompleted()"
              >
                Zakończ
              </ui-button>
            }
          </div>
        </section>

        @if (details.conflict; as conflict) {
          <ui-card>
            <div class="rounded-[1rem] border border-danger/30 bg-danger-soft px-4 py-4">
              <p class="text-label text-danger">Konflikt w przeglądzie</p>
              <p class="mt-2 text-body text-text-main">{{ conflict.message }}</p>
            </div>
          </ui-card>
        }

        <section class="grid gap-4">
          <ui-card>
            <div card-header class="space-y-1">
              <p class="ui-kicker">Klient</p>
              <h2 class="text-h3 tracking-[-0.02em] text-text-main">Dane kontaktowe</h2>
            </div>

            <div class="space-y-4">
              <div>
                <p class="text-h3 tracking-[-0.02em] text-text-main">
                  {{ customerName(details.customer) }}
                </p>
                <p class="mt-1 text-body text-text-muted">{{ details.customer.fullName || '--' }}</p>
              </div>

              <div class="space-y-1 text-body text-text-main">
                @if (details.customer.phone) {
                  <a
                    [href]="phoneHref(details.customer.phone)"
                    class="inline-flex items-center rounded-[0.85rem] border border-border/80 bg-white px-3 py-2 text-label font-medium text-primary-strong transition hover:border-primary/24 hover:bg-primary-soft/32"
                  >
                    {{ details.customer.phone }}
                  </a>
                } @else {
                  <p>--</p>
                }
                <p>{{ details.customer.email || '--' }}</p>
                <p>{{ details.customer.address || '--' }}, {{ details.customer.postalCode }} {{ details.customer.city }}</p>
              </div>

              <div class="rounded-[1rem] border border-border/80 bg-white p-4 shadow-card">
                @if (!details.inspection.plannedDate) {
                  <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                    Planowany termin
                  </p>
                  <p class="mt-2 text-label text-text-main">
                    {{ formatInspectionWindow(details.inspection.windowStart, details.inspection.windowEnd) }}
                  </p>
                }
                <p
                  class="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted"
                  [class.mt-3]="!details.inspection.plannedDate"
                >
                  Termin przeglądu
                </p>
                <p class="mt-2 text-label text-text-main">
                  {{ details.inspection.plannedDate ? formatInspectionDate(details.inspection.plannedDate) : 'Termin niepotwierdzony' }}
                </p>
              </div>
            </div>
          </ui-card>
        </section>

        <ui-card>
          <div card-header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 class="text-h3 tracking-[-0.02em] text-text-main">Urządzenia</h2>
            <div class="flex flex-wrap items-center gap-3">
              <ui-badge variant="info">{{ details.devices.length }} urządzenia</ui-badge>
              <ui-button
                size="sm"
                variant="secondary"
                [disabled]="!canAddDevice()"
                (pressed)="isAddDeviceModalOpen.set(true)"
              >
                Dodaj urządzenie
              </ui-button>
            </div>
          </div>

          <div class="space-y-3">
            @for (device of details.devices; track device.id) {
              <article class="rounded-[1rem] border border-border/85 bg-white px-4 py-4 shadow-card">
                <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div class="space-y-1">
                    <p class="text-label text-text-main">{{ device.brand }} {{ device.model }}</p>
                    <p class="text-small text-text-muted">
                      {{ deviceAddress(details.customer, device) }}
                    </p>
                    <p class="text-small text-text-muted">
                      Następny przegląd: {{ formatInspectionDate(device.nextInspectionDate) }}
                    </p>
                  </div>

                  <div class="flex flex-wrap gap-2">
                    <ui-button
                      variant="ghost"
                      size="sm"
                      (pressed)="navigateToDevice(details.customer.id, device.id)"
                    >
                      Szczegóły urządzenia
                    </ui-button>
                    <ui-button
                      variant="ghost"
                      size="sm"
                      [disabled]="!canRemoveDevice()"
                      (pressed)="removeDevice(device.id)"
                    >
                      Usuń urządzenie
                    </ui-button>
                  </div>
                </div>
              </article>
            }
          </div>
        </ui-card>

        <ui-modal
          [open]="isAddDeviceModalOpen()"
          title="Dodaj urządzenie do przeglądu"
          description="Pokazujemy tylko urządzenia tego klienta, które mają aktywne przeglądy, nie należą do innego otwartego obiektu i mieszczą się w oknie 30 dni."
          (close)="closeAddDeviceModal()"
        >
          @if (addableDevices().length) {
            <div class="space-y-2">
              @for (device of addableDevices(); track device.id) {
                <label
                  class="flex cursor-pointer items-start gap-3 rounded-[1rem] border border-border/85 bg-white px-4 py-3 transition hover:border-primary/24 hover:bg-primary-soft/20"
                >
                  <input
                    type="checkbox"
                    class="mt-1 size-4 shrink-0 rounded border-border accent-[var(--color-primary)]"
                    [checked]="selectedDeviceIds().includes(device.id)"
                    (change)="toggleDeviceSelection(device.id)"
                  />

                  <span class="min-w-0">
                    <span class="block text-label text-text-main">{{ device.brand }} {{ device.model }}</span>
                    <span class="block text-small text-text-muted">
                      {{ deviceAddress(details.customer, device) }} • {{ formatInspectionDate(device.nextInspectionDate) }}
                    </span>
                  </span>
                </label>
              }
            </div>
          } @else {
            <div class="rounded-[1rem] border border-dashed border-border/90 bg-white/76 px-4 py-5 text-body text-text-muted">
              Brak urządzeń, które można teraz bezpiecznie dodać do tego przeglądu.
            </div>
          }

          <div modal-footer class="grid gap-3 sm:grid-cols-2">
            <ui-button type="button" variant="ghost" [block]="true" (pressed)="closeAddDeviceModal()">
              Zamknij
            </ui-button>
            <ui-button
              type="button"
              [block]="true"
              [disabled]="!selectedDeviceIds().length"
              (pressed)="attachSelectedDevices()"
            >
              Dodaj urządzenia
            </ui-button>
          </div>
        </ui-modal>

        <app-inspection-schedule-modal
          [open]="isScheduleModalOpen()"
          [initialDate]="scheduleModalInitialDate()"
          (close)="isScheduleModalOpen.set(false)"
          (save)="scheduleInspection($event)"
        />
      } @else {
        <ui-empty-state
          title="Nie znaleźliśmy przeglądu"
          description="Sprawdź identyfikator albo wróć do listy przeglądów."
          actionLabel="Wróć do listy przeglądów"
          (action)="navigateToList()"
        />
      }
    </div>
  `,
})
export class InspectionDetailViewComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly inspectionsStore = inject(InspectionsStore);

  protected readonly inspectionId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('inspectionId') ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('inspectionId') ?? '' },
  );
  protected readonly listViewParam = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('view'))),
    { initialValue: this.route.snapshot.queryParamMap.get('view') },
  );
  protected readonly isScheduleModalOpen = signal(false);
  protected readonly isAddDeviceModalOpen = signal(false);
  protected readonly selectedDeviceIds = signal<string[]>([]);
  protected readonly details = computed(() =>
    this.inspectionsStore.getInspectionDetailsById(this.inspectionId()),
  );
  protected readonly listViewId = computed(() => {
    const explicitView = this.listViewParam();

    if (explicitView) {
      return parseInspectionListViewId(explicitView);
    }

    const status = this.details()?.inspection.status;

    return status ? getInspectionListViewIdForStatus(status) : DEFAULT_INSPECTION_LIST_VIEW_ID;
  });
  protected readonly listQueryParams = computed(() =>
    buildInspectionListViewQueryParams(this.listViewId()),
  );
  protected readonly scheduleModalInitialDate = computed(() => {
    const inspection = this.details()?.inspection;

    if (!inspection) {
      return '';
    }

    return inspection.plannedDate || inspection.targetDate || inspection.windowStart || '';
  });
  protected readonly addableDevices = computed(() => {
    const details = this.details();

    if (!details || !this.canAddDevice()) {
      return [];
    }

    return details.customer.devices.filter((device) => {
      if (!isDeviceEligibleForInspection(device)) {
        return false;
      }

      if (details.inspection.deviceIds.includes(device.id)) {
        return false;
      }

      const activeInspection = this.inspectionsStore.getActiveInspectionByDeviceId(device.id);

      if (activeInspection && activeInspection.id !== details.inspection.id) {
        return false;
      }

      return inspectionCanIncludeDate(
        details.inspection,
        device.nextInspectionDate,
        this.inspectionsStore.devicesById(),
      );
    });
  });

  protected readonly getInspectionStatusLabel = getInspectionStatusLabel;
  protected readonly getInspectionStatusVariant = getInspectionStatusVariant;
  protected readonly formatInspectionWindow = formatInspectionWindow;
  protected readonly formatInspectionDate = formatInspectionDate;

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

  protected navigateToList(): void {
    void this.router.navigate(['/inspections'], {
      queryParams: this.listQueryParams(),
    });
  }

  protected navigateToDevice(customerId: string, deviceId: string): void {
    void this.router.navigate(['/customers', customerId, 'devices', deviceId]);
  }

  protected canAddDevice(): boolean {
    const status = this.details()?.inspection.status;

    return status !== 'completed' && status !== 'cancelled';
  }

  protected canSchedule(): boolean {
    const status = this.details()?.inspection.status;

    return status ? canScheduleInspection(status) : false;
  }

  protected canComplete(): boolean {
    const status = this.details()?.inspection.status;

    return status ? canCompleteInspection(status) : false;
  }

  protected canRemoveDevice(): boolean {
    return this.canAddDevice();
  }

  protected phoneHref(phone: string): string {
    const normalizedPhone = phone.replace(/[^\d+]/g, '');

    return normalizedPhone ? `tel:${normalizedPhone}` : '#';
  }

  protected scheduleActionLabel(status: InspectionStatus): string {
    return getInspectionScheduleActionLabel(status);
  }

  protected scheduleInspection(plannedDate: string): void {
    const inspectionId = this.details()?.inspection.id;

    if (!inspectionId) {
      return;
    }

    this.inspectionsStore.setPlannedDate(inspectionId, plannedDate);
    this.isScheduleModalOpen.set(false);
  }

  protected markCompleted(): void {
    const inspectionId = this.details()?.inspection.id;

    if (!inspectionId) {
      return;
    }

    this.inspectionsStore.markCompleted(inspectionId);
  }

  protected toggleDeviceSelection(deviceId: string): void {
    this.selectedDeviceIds.update((deviceIds) =>
      deviceIds.includes(deviceId)
        ? deviceIds.filter((currentId) => currentId !== deviceId)
        : [...deviceIds, deviceId],
    );
  }

  protected closeAddDeviceModal(): void {
    this.selectedDeviceIds.set([]);
    this.isAddDeviceModalOpen.set(false);
  }

  protected attachSelectedDevices(): void {
    const inspectionId = this.details()?.inspection.id;

    if (!inspectionId) {
      return;
    }

    for (const deviceId of this.selectedDeviceIds()) {
      this.inspectionsStore.attachDeviceToInspection(inspectionId, deviceId);
    }

    this.closeAddDeviceModal();
  }

  protected removeDevice(deviceId: string): void {
    const details = this.details();

    if (!details) {
      return;
    }

    const result = this.inspectionsStore.removeDeviceFromInspection(details.inspection.id, deviceId);

    if (result.deletedInspection?.id === details.inspection.id) {
      this.navigateToList();
    }
  }
}
