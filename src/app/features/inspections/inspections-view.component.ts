import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { map } from 'rxjs';

import {
  UiBadgeComponent,
  UiButtonComponent,
  UiCardComponent,
  UiEmptyStateComponent,
  UiInputComponent,
  UiSelectComponent,
  UiSelectOption,
} from '../../ui';
import { Customer } from '../customers/models/customer.model';
import { Device } from '../customers/models/device.model';
import { InspectionCreateModalComponent } from './components/inspection-create-modal.component';
import { InspectionFinalizeModalComponent } from './components/inspection-finalize-modal.component';
import { InspectionScheduleModalComponent } from './components/inspection-schedule-modal.component';
import { InspectionDetails, InspectionsStore } from './data/inspections.store';
import { InspectionStatus } from './models/inspection.model';
import {
  DEFAULT_INSPECTION_LIST_VIEW_ID,
  INSPECTION_LIST_VIEWS,
  InspectionListViewId,
  buildInspectionListViewQueryParams,
  getInspectionListViewDefinition,
  matchesInspectionListView,
  parseInspectionListViewId,
} from './models/inspection-list-view.model';
import {
  canCompleteInspection,
  canScheduleInspection,
  formatInspectionDate,
  getInspectionScheduleActionLabel,
  getInspectionStatusLabel,
} from './utils/inspection-ui.util';

@Component({
  selector: 'app-inspections-view',
  standalone: true,
  imports: [
    FormsModule,
    TranslocoPipe,
    UiBadgeComponent,
    UiButtonComponent,
    UiCardComponent,
    UiEmptyStateComponent,
    UiInputComponent,
    UiSelectComponent,
    InspectionCreateModalComponent,
    InspectionFinalizeModalComponent,
    InspectionScheduleModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-10">
      <section class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 class="text-display tracking-[-0.035em] text-text-main">{{ 'inspections.title' | transloco }}</h1>
        <ui-button size="sm" (pressed)="openCreateModal()">
          {{ 'inspections.actions.add' | transloco }}
        </ui-button>
      </section>

      <ui-card padding="sm">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div class="space-y-1">
            <div class="flex flex-wrap items-center gap-3">
              <p class="text-h3 tracking-[-0.02em] text-text-main">{{ activeView().labelKey | transloco }}</p>
              <ui-badge variant="neutral">{{ activeViewCount() }}</ui-badge>
            </div>
            <p class="text-small text-text-muted">
              {{ activeView().descriptionKey | transloco }}
            </p>
          </div>

          <div class="grid gap-3 lg:w-[42rem] lg:grid-cols-[minmax(0,1fr)_minmax(16rem,18rem)]">
            <ui-input
              [label]="'common.search.label' | transloco"
              [placeholder]="'inspections.searchPlaceholder' | transloco"
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
            />

            <ui-select
              [label]="'inspections.quickNavigation' | transloco"
              placeholder=""
              [ngModel]="activeViewId()"
              [options]="viewOptions()"
              (ngModelChange)="navigateToView($event)"
            />
          </div>
        </div>
      </ui-card>

      <section class="pt-4">
      @if (activeViewId() === 'orphan-devices') {
        @if (filteredOrphanDevices().length) {
          <div class="space-y-3">
            @for (item of filteredOrphanDevices(); track item.device.id) {
              <ui-card>
                <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div class="space-y-2">
                    <p class="text-h3 tracking-[-0.02em] text-text-main">
                      {{ item.device.brand }} {{ item.device.model }}
                    </p>
                    <p class="text-body text-text-muted">
                      {{ customerName(item.customer) }} • {{ deviceAddress(item.customer, item.device) }}
                    </p>
                    <p class="text-small text-text-muted">
                      {{ 'devices.inspections.disabled' | transloco }}
                    </p>
                  </div>

                  <ui-button
                    variant="secondary"
                    size="sm"
                    (pressed)="openCreateModalForDevice(item.customer.id, item.device.id)"
                  >
                    {{ 'inspections.actions.add' | transloco }}
                  </ui-button>
                </div>
              </ui-card>
            }
          </div>
        } @else {
          <ui-empty-state
            [title]="'inspections.empty.orphanDevicesTitle' | transloco"
            [description]="'inspections.empty.orphanDevicesDescription' | transloco"
          />
        }
      } @else if (filteredInspections().length) {
        <div class="overflow-hidden rounded-[1.1rem] border border-border/90 bg-white shadow-card">
          <div class="md:hidden">
            @for (details of filteredInspections(); track details.inspection.id) {
              <article
                class="ui-focus-ring border-b border-border/80 px-4 py-4 transition-colors duration-200 last:border-b-0 hover:bg-primary-soft/20"
                role="button"
                tabindex="0"
                [attr.aria-label]="
                  'inspections.openDetailsAria'
                    | transloco: { customer: customerName(details.customer) }
                "
                (click)="navigateToInspection(details.inspection.id)"
                (keydown)="handleInspectionKeydown($event, details.inspection.id)"
              >
                <div class="space-y-4">
                  <div class="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 gap-y-1">
                    <p class="pr-2 pt-0.5 text-[10px]/4 font-semibold uppercase tracking-[0.14em] text-text-muted">
                      {{ 'inspections.table.date' | transloco }}
                    </p>
                    <div class="min-w-0">
                      <p class="text-[15px]/6 font-semibold tracking-[-0.02em] text-text-main">
                        {{ inspectionDateLabel(details) }}
                      </p>
                      <p class="text-small text-text-muted">{{ inspectionStatusLabel(details.inspection.status) }}</p>
                    </div>
                  </div>

                  <div class="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 gap-y-1">
                    <p class="pr-2 pt-0.5 text-[10px]/4 font-semibold uppercase tracking-[0.14em] text-text-muted">
                      {{ 'inspections.table.customer' | transloco }}
                    </p>
                    <div class="min-w-0">
                      <p class="text-[15px]/6 font-semibold tracking-[-0.02em] text-text-main">
                        {{ customerName(details.customer) }}
                      </p>
                      <p class="text-small text-text-muted">{{ inspectionAddressSummary(details) }}</p>
                    </div>
                  </div>

                  <div class="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 gap-y-1">
                    <p class="pr-2 pt-0.5 text-[10px]/4 font-semibold uppercase tracking-[0.14em] text-text-muted">
                      {{ 'inspections.table.phone' | transloco }}
                    </p>
                    <div class="min-w-0">
                      @if (details.customer.phone) {
                        <a
                          [href]="phoneHref(details.customer.phone)"
                          class="inline-flex items-center rounded-[0.75rem] border border-border/80 px-3 py-1.5 text-label font-medium text-primary-strong transition hover:border-primary/24 hover:bg-primary-soft/32"
                          (click)="$event.stopPropagation()"
                        >
                          {{ details.customer.phone }}
                        </a>
                      } @else {
                        <p class="text-label text-text-muted">--</p>
                      }
                    </div>
                  </div>

                  <div class="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 gap-y-1">
                    <p class="pr-2 pt-0.5 text-[10px]/4 font-semibold uppercase tracking-[0.14em] text-text-muted">
                      {{ 'inspections.table.actions' | transloco }}
                    </p>
                    <div class="flex flex-wrap gap-2">
                      @if (canScheduleFromList(details.inspection.status)) {
                        <ui-button
                          size="sm"
                          variant="secondary"
                          (pressed)="handleScheduleButtonPress($event, details.inspection.id)"
                        >
                          {{ scheduleActionLabel(details.inspection.status) }}
                        </ui-button>
                      }
                      @if (canCompleteFromList(details.inspection.status)) {
                        <ui-button
                          size="sm"
                          variant="ghost"
                          (pressed)="handleCompleteButtonPress($event, details.inspection.id)"
                        >
                          {{ 'inspections.actions.complete' | transloco }}
                        </ui-button>
                      }
                    </div>
                  </div>
                </div>
              </article>
            }
          </div>

          <div class="hidden overflow-x-auto md:block">
            <table class="min-w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th class="border-b border-border/90 bg-[linear-gradient(180deg,_rgb(247_250_255/0.96),_rgb(238_244_255/0.94))] px-5 py-4 text-left text-[11px]/5 font-semibold uppercase tracking-[0.18em] text-text-muted first:pl-6">
                    {{ 'inspections.table.date' | transloco }}
                  </th>
                  <th class="border-b border-border/90 bg-[linear-gradient(180deg,_rgb(247_250_255/0.96),_rgb(238_244_255/0.94))] px-5 py-4 text-left text-[11px]/5 font-semibold uppercase tracking-[0.18em] text-text-muted">
                    {{ 'inspections.table.customer' | transloco }}
                  </th>
                  <th class="border-b border-border/90 bg-[linear-gradient(180deg,_rgb(247_250_255/0.96),_rgb(238_244_255/0.94))] px-5 py-4 text-left text-[11px]/5 font-semibold uppercase tracking-[0.18em] text-text-muted">
                    {{ 'inspections.table.phone' | transloco }}
                  </th>
                  <th class="border-b border-border/90 bg-[linear-gradient(180deg,_rgb(247_250_255/0.96),_rgb(238_244_255/0.94))] px-5 py-4 text-right text-[11px]/5 font-semibold uppercase tracking-[0.18em] text-text-muted last:pr-6">
                    {{ 'inspections.table.actions' | transloco }}
                  </th>
                </tr>
              </thead>

              <tbody class="[&_tr:last-child_td]:border-b-0">
                @for (details of filteredInspections(); track details.inspection.id) {
                  <tr
                    class="group/row ui-focus-ring cursor-pointer transition duration-200 hover:bg-primary-soft/18 focus-visible:bg-primary-soft/22"
                    role="button"
                    tabindex="0"
                    [attr.aria-label]="
                      'inspections.openDetailsAria'
                        | transloco: { customer: customerName(details.customer) }
                    "
                    (click)="navigateToInspection(details.inspection.id)"
                    (keydown)="handleInspectionKeydown($event, details.inspection.id)"
                  >
                    <td class="border-b border-border/80 bg-white px-5 py-4.5 align-top first:border-l-2 first:border-l-transparent first:pl-6 group-hover/row:bg-primary-soft/30 group-hover/row:first:border-l-primary/55">
                      <div class="flex min-w-0 flex-col gap-1">
                        <p class="text-[15px]/6 font-semibold tracking-[-0.02em] text-text-main">
                          {{ inspectionDateLabel(details) }}
                        </p>
                        <p class="text-small text-text-muted">{{ inspectionStatusLabel(details.inspection.status) }}</p>
                      </div>
                    </td>

                    <td class="border-b border-border/80 bg-white px-5 py-4.5 align-top group-hover/row:bg-primary-soft/30">
                      <div class="flex min-w-0 flex-col gap-1">
                        <p class="text-[15px]/6 font-semibold tracking-[-0.02em] text-text-main">
                          {{ customerName(details.customer) }}
                        </p>
                        <p class="text-[13px]/5 text-text-main/76">
                          {{ inspectionAddressSummary(details) }}
                        </p>
                      </div>
                    </td>

                    <td class="border-b border-border/80 bg-white px-5 py-4.5 align-top group-hover/row:bg-primary-soft/30">
                      @if (details.customer.phone) {
                        <a
                          [href]="phoneHref(details.customer.phone)"
                          class="inline-flex items-center rounded-[0.85rem] border border-border/80 bg-white px-3 py-2 text-label font-medium text-primary-strong transition hover:border-primary/24 hover:bg-primary-soft/32"
                          (click)="$event.stopPropagation()"
                        >
                          {{ details.customer.phone }}
                        </a>
                      } @else {
                        <span class="text-label text-text-muted">--</span>
                      }
                    </td>

                    <td class="border-b border-border/80 bg-white px-5 py-4.5 align-top text-right last:pr-6 group-hover/row:bg-primary-soft/30">
                      <div class="flex justify-end gap-2">
                        @if (canScheduleFromList(details.inspection.status)) {
                          <ui-button
                            size="sm"
                            variant="secondary"
                            (pressed)="handleScheduleButtonPress($event, details.inspection.id)"
                          >
                            {{ scheduleActionLabel(details.inspection.status) }}
                          </ui-button>
                        }
                        @if (canCompleteFromList(details.inspection.status)) {
                          <ui-button
                            size="sm"
                            variant="ghost"
                            (pressed)="handleCompleteButtonPress($event, details.inspection.id)"
                          >
                            {{ 'inspections.actions.complete' | transloco }}
                          </ui-button>
                        }
                        @if (!canScheduleFromList(details.inspection.status) && !canCompleteFromList(details.inspection.status)) {
                          <span class="text-small text-text-muted">--</span>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      } @else {
        <ui-empty-state
          [title]="'inspections.empty.viewTitle' | transloco"
          [description]="'inspections.empty.viewDescription' | transloco"
          [actionLabel]="'inspections.actions.add' | transloco"
          (action)="isCreateModalOpen.set(true)"
        />
      }
      </section>

      <app-inspection-create-modal
        [open]="isCreateModalOpen()"
        [customers]="customerOptions()"
        [devices]="manualCreateDeviceOptions()"
        [initialCustomerId]="manualCreateInitialCustomerId() || (customerOptions()[0]?.id ?? '')"
        [initialDeviceIds]="manualCreateInitialDeviceIds()"
        (close)="isCreateModalOpen.set(false)"
        (save)="handleManualCreate($event)"
      />

      <app-inspection-schedule-modal
        [open]="isScheduleModalOpen()"
        [initialDate]="selectedInspectionPlannedDate()"
        (close)="closeScheduleModal()"
        (save)="scheduleInspectionFromList($event)"
      />

      <app-inspection-finalize-modal
        [open]="isFinalizeModalOpen()"
        [inspectionId]="finalizingInspectionId()"
        (close)="closeFinalizeModal()"
      />
    </div>
  `,
})
export class InspectionsViewComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly inspectionsStore = inject(InspectionsStore);
  private readonly transloco = inject(TranslocoService);

  private readonly selectedViewParam = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('view'))),
    {
      initialValue: this.route.snapshot.queryParamMap.get('view'),
    },
  );
  private readonly activeLanguage = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  protected readonly isCreateModalOpen = signal(false);
  protected readonly scheduledInspectionId = signal<string | null>(null);
  protected readonly finalizingInspectionId = signal<string | null>(null);
  protected readonly manualCreateInitialCustomerId = signal('');
  protected readonly manualCreateInitialDeviceIds = signal<string[]>([]);
  protected readonly searchQuery = signal('');

  protected readonly inspectionDetails = this.inspectionsStore.inspectionDetails;
  protected readonly orphanDevices = this.inspectionsStore.devicesWithoutInspection;
  protected readonly viewOptions = computed<UiSelectOption[]>(() => {
    this.activeLanguage();

    return INSPECTION_LIST_VIEWS.map((view) => ({
      value: view.id,
      label: this.transloco.translate(view.labelKey),
    }));
  });
  protected readonly activeViewId = computed(() =>
    parseInspectionListViewId(this.selectedViewParam()),
  );
  protected readonly activeView = computed(() =>
    getInspectionListViewDefinition(this.activeViewId()),
  );
  protected readonly filteredInspections = computed(() => {
    const activeViewId = this.activeViewId();

    if (activeViewId === 'orphan-devices') {
      return [];
    }

    return this.inspectionDetails().filter((details) =>
      matchesInspectionListView(details.inspection.status, activeViewId) &&
      this.matchesSearchQuery(this.inspectionSearchText(details)),
    );
  });
  protected readonly filteredOrphanDevices = computed(() =>
    this.orphanDevices().filter((item) =>
      this.matchesSearchQuery(
        [
          this.customerName(item.customer),
          item.customer.address,
          `${item.customer.postalCode} ${item.customer.city}`.trim(),
          this.deviceAddress(item.customer, item.device),
        ].join(' '),
      ),
    ),
  );
  protected readonly activeViewCount = computed(() => this.countForView(this.activeViewId()));
  protected readonly selectedInspectionForScheduling = computed(() => {
    const inspectionId = this.scheduledInspectionId();

    return inspectionId
      ? this.inspectionDetails().find((details) => details.inspection.id === inspectionId)
      : undefined;
  });
  protected readonly selectedInspectionPlannedDate = computed(() => {
    const inspection = this.selectedInspectionForScheduling()?.inspection;

    if (!inspection) {
      return '';
    }

    return inspection.inspectionDate;
  });
  protected readonly isScheduleModalOpen = computed(() => Boolean(this.scheduledInspectionId()));
  protected readonly isFinalizeModalOpen = computed(() => Boolean(this.finalizingInspectionId()));
  protected readonly customerOptions = computed(() =>
    this.filteredOrphanDevices()
      .map((item) => item.customer)
      .filter((customer, index, list) => list.findIndex((entry) => entry.id === customer.id) === index)
      .map((customer) => ({ id: customer.id, label: this.customerName(customer) })),
  );
  protected readonly manualCreateDeviceOptions = computed(() =>
    this.filteredOrphanDevices().map((item) => ({
      customerId: item.customer.id,
      deviceId: item.device.id,
      label: `${item.device.brand} ${item.device.model}`.trim(),
      description: this.deviceAddress(item.customer, item.device),
    })),
  );

  protected readonly formatInspectionDate = formatInspectionDate;
  protected inspectionStatusLabel(status: InspectionStatus): string {
    return getInspectionStatusLabel(status, this.transloco);
  }

  protected navigateToView(viewId: string): void {
    const nextViewId = parseInspectionListViewId(viewId || DEFAULT_INSPECTION_LIST_VIEW_ID);

    if (nextViewId === this.activeViewId()) {
      return;
    }

    void this.router.navigate(['/inspections'], {
      queryParams: buildInspectionListViewQueryParams(nextViewId),
    });
  }

  protected navigateToInspection(inspectionId: string): void {
    void this.router.navigate(['/inspections', inspectionId], {
      queryParams: buildInspectionListViewQueryParams(this.activeViewId()),
    });
  }

  protected handleInspectionKeydown(event: KeyboardEvent, inspectionId: string): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    this.navigateToInspection(inspectionId);
  }

  protected openCreateModal(): void {
    this.manualCreateInitialCustomerId.set('');
    this.manualCreateInitialDeviceIds.set([]);
    this.isCreateModalOpen.set(true);
  }

  protected openCreateModalForDevice(customerId: string, deviceId: string): void {
    this.manualCreateInitialCustomerId.set(customerId);
    this.manualCreateInitialDeviceIds.set([deviceId]);
    this.isCreateModalOpen.set(true);
  }

  protected handleManualCreate(event: { customerId: string; deviceIds: string[]; inspectionDate: string }): void {
    this.inspectionsStore.createInspection({
      customerId: event.customerId,
      deviceIds: event.deviceIds,
      inspectionDate: event.inspectionDate,
      source: 'manual',
    });
    this.manualCreateInitialCustomerId.set('');
    this.manualCreateInitialDeviceIds.set([]);
    this.isCreateModalOpen.set(false);
  }

  protected openScheduleModal(inspectionId: string): void {
    this.scheduledInspectionId.set(inspectionId);
  }

  protected handleScheduleButtonPress(event: MouseEvent, inspectionId: string): void {
    event.stopPropagation();
    this.openScheduleModal(inspectionId);
  }

  protected closeScheduleModal(): void {
    this.scheduledInspectionId.set(null);
  }

  protected scheduleInspectionFromList(inspectionDate: string): void {
    const inspectionId = this.scheduledInspectionId();

    if (!inspectionId) {
      return;
    }

    this.inspectionsStore.setInspectionDate(inspectionId, inspectionDate);
    this.closeScheduleModal();
  }

  protected handleCompleteButtonPress(event: MouseEvent, inspectionId: string): void {
    event.stopPropagation();
    this.finalizingInspectionId.set(inspectionId);
  }

  protected closeFinalizeModal(): void {
    this.finalizingInspectionId.set(null);
  }

  protected scheduleActionLabel(status: InspectionStatus): string {
    return getInspectionScheduleActionLabel(status, this.transloco);
  }

  protected canScheduleFromList(status: InspectionStatus): boolean {
    return canScheduleInspection(status);
  }

  protected canCompleteFromList(status: InspectionStatus): boolean {
    return canCompleteInspection(status);
  }

  protected inspectionDateLabel(details: InspectionDetails): string {
    return details.inspection.inspectionDate
      ? formatInspectionDate(details.inspection.inspectionDate)
      : this.transloco.translate('inspections.detail.unconfirmedDate');
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

    return this.transloco.translate('inspections.addressesPrefix', {
      addresses: addresses.join(' | '),
    });
  }

  protected phoneHref(phone: string): string {
    const normalizedPhone = phone.replace(/[^\d+]/g, '');

    return normalizedPhone ? `tel:${normalizedPhone}` : '#';
  }

  protected customerName(customer: Customer): string {
    return customer.companyName || customer.fullName || this.transloco.translate('customers.fallbackName');
  }

  protected deviceAddress(customer: Customer, device: Device): string {
    const street = device.hasCustomInstallationAddress ? device.address : customer.address;
    const cityLine = device.hasCustomInstallationAddress
      ? `${device.postalCode} ${device.city}`.trim()
      : `${customer.postalCode} ${customer.city}`.trim();

    return [street, cityLine].filter(Boolean).join(', ') || '--';
  }

  private countForView(viewId: InspectionListViewId): number {
    if (viewId === 'orphan-devices') {
      return this.filteredOrphanDevices().length;
    }

    if (viewId === this.activeViewId()) {
      return this.filteredInspections().length;
    }

    return this.inspectionDetails().filter((details) => {
      if (!matchesInspectionListView(details.inspection.status, viewId)) {
        return false;
      }

      return this.matchesSearchQuery(this.inspectionSearchText(details));
    }).length;
  }

  private inspectionSearchText(details: InspectionDetails): string {
    return [
      this.customerName(details.customer),
      details.customer.address,
      `${details.customer.postalCode} ${details.customer.city}`.trim(),
      this.inspectionAddressSummary(details),
    ].join(' ');
  }

  private matchesSearchQuery(value: string): boolean {
    const query = normalizeSearchValue(this.searchQuery());

    if (!query) {
      return true;
    }

    return normalizeSearchValue(value).includes(query);
  }
}

function normalizeSearchValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
