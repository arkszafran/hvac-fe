import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
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
import { DeviceDraft, getDeviceTypeLabel as readDeviceTypeLabel } from '../customers/models/device.model';
import { InspectionCandidatePickerModalComponent } from '../inspections/components/inspection-candidate-picker-modal.component';
import { InspectionLinkProposalModalComponent } from '../inspections/components/inspection-link-proposal-modal.component';
import {
  DeviceUpdateInspectionPlan,
  InspectionDeviceFlowService,
} from '../inspections/data/inspection-device-flow.service';
import { InspectionsStore } from '../inspections/data/inspections.store';
import { InspectionStatus } from '../inspections/models/inspection.model';
import {
  getInspectionStatusLabel,
  getInspectionStatusVariant,
} from '../inspections/utils/inspection-ui.util';
import { VisitsStore } from '../visits/data/visits.store';
import { getVisitTypeLabel, VisitType } from '../visits/models/visit.model';
import { DevicesStore } from './data/devices.store';
import { Device } from './models/device.model';

interface DeviceDetailItem {
  labelKey: string;
  value: string;
}

@Component({
  selector: 'app-device-detail-view',
  standalone: true,
  imports: [
    RouterLink,
    TranslocoPipe,
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
                {{ 'devices.detail.breadcrumbs.deviceList' | transloco }}
              </a>
              <span aria-hidden="true">/</span>
              <span class="text-text-main">{{ 'devices.detail.breadcrumbs.device' | transloco }}</span>
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
              {{ 'devices.actions.edit' | transloco }}
            </ui-button>
          </div>
        </section>

        <section class="grid gap-4 xl:grid-cols-[minmax(0,1.18fr)_minmax(320px,0.82fr)]">
          <ui-card>
            <div card-header class="space-y-1">
              <p class="ui-kicker">{{ 'devices.detail.sections.deviceData' | transloco }}</p>
              <h2 class="text-h3 tracking-[-0.02em] text-text-main">{{ 'devices.detail.sections.mainInfo' | transloco }}</h2>
            </div>

            <dl class="grid gap-3 sm:grid-cols-2">
              @for (item of deviceOverviewItems(); track item.labelKey) {
                <div class="rounded-[1rem] bg-surface/52 px-4 py-3">
                  <dt class="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                    {{ item.labelKey | transloco }}
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
                    {{ 'devices.detail.fields.nextInspection' | transloco }}
                  </dt>

                  <button
                    type="button"
                    class="ui-focus-ring rounded-md text-[13px]/5 font-semibold text-primary-strong transition hover:text-primary"
                    (click)="isNextInspectionModalOpen.set(true)"
                  >
                    {{ 'devices.actions.manageInspections' | transloco }}
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
              <p class="ui-kicker">{{ 'devices.detail.sections.inspectionService' | transloco }}</p>
              <h2 class="text-h3 tracking-[-0.02em] text-text-main">{{ 'devices.detail.sections.planningStatus' | transloco }}</h2>
            </div>

            @if (activeInspection(); as inspection) {
              <div class="space-y-4">
                <div class="flex flex-wrap items-center gap-3">
                  <ui-badge [variant]="getInspectionStatusVariant(inspection.status)">
                    {{ getInspectionStatusLabel(inspection.status) }}
                  </ui-badge>
                  <span class="text-small text-text-muted">
                    {{ 'devices.detail.sections.planningProcess' | transloco }}
                  </span>
                </div>

                <div class="rounded-[1rem] border border-border/80 bg-white p-4 shadow-card">
                  <p class="text-label text-text-main">
                    {{ 'devices.detail.devicesInProcess' | transloco: { count: inspection.deviceIds.length } }}
                  </p>
                  <p class="mt-2 text-small text-text-muted">
                    {{ 'devices.detail.processDescription' | transloco }}
                  </p>
                </div>

                <ui-button variant="secondary" size="sm" (pressed)="navigateToInspection(inspection.id)">
                  {{ 'devices.actions.openInspectionProcess' | transloco }}
                </ui-button>
              </div>
            } @else if (requiresInspectionAttention()) {
              <div class="space-y-3 rounded-[1rem] border border-warning/30 bg-warning-soft px-4 py-4">
                <p class="text-label text-accent-strong">{{ 'devices.detail.missingProcessTitle' | transloco }}</p>
                <p class="text-body text-text-main">
                  {{ 'devices.detail.missingProcessDescription' | transloco }}
                </p>
                <ui-button variant="secondary" size="sm" (pressed)="navigateToInspections()">
                  {{ 'devices.actions.goToPlanning' | transloco }}
                </ui-button>
              </div>
            } @else {
              <ui-empty-state
                [title]="'devices.detail.noPlanningTitle' | transloco"
                [description]="'devices.detail.noPlanningDescription' | transloco"
              />
            }
          </ui-card>
        </section>

        <ui-card>
          <div card-header class="space-y-1">
            <p class="ui-kicker">{{ 'devices.detail.sections.installation' | transloco }}</p>
            <h2 class="text-h3 tracking-[-0.02em] text-text-main">{{ 'devices.detail.sections.locationAndNotes' | transloco }}</h2>
          </div>

          <div class="space-y-5">
            <dl class="space-y-4">
              @for (item of installationFacts(); track item.labelKey) {
                <div class="border-b border-border/60 pb-4 last:border-b-0 last:pb-0">
                  <dt class="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                    {{ item.labelKey | transloco }}
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
                {{ 'devices.detail.fields.note' | transloco }}
              </p>
              <p
                class="mt-2 rounded-[0.95rem] bg-white px-3.5 py-3 text-body font-semibold text-text-main shadow-[0_10px_20px_-18px_rgb(15_23_42/0.5)]"
              >
                {{ device.note || ('devices.detail.noNote' | transloco) }}
              </p>
            </div>
          </div>
        </ui-card>

        <ui-card>
          <div card-header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 class="text-h3 tracking-[-0.02em] text-text-main">{{ 'devices.detail.sections.serviceHistory' | transloco }}</h2>
            <ui-badge variant="info">{{ 'devices.detail.entriesCount' | transloco: { count: deviceVisits().length } }}</ui-badge>
          </div>

          @if (deviceVisits().length) {
            <div class="space-y-3">
              @for (details of deviceVisits(); track details.visit.id) {
                <article class="rounded-[1rem] border border-border/80 bg-white/76 px-4 py-3">
                  <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p class="text-label text-text-main">{{ getVisitTypeLabel(details.visit.type) }}</p>
                      <p class="text-small text-text-muted">{{ customerTitle(details.customer) }}</p>
                    </div>
                    <p class="text-small text-text-muted">{{ formatDate(details.visit.date) }}</p>
                  </div>

                  <p class="mt-2 text-body text-text-main">{{ visitNote(device.id, details.visit.id) }}</p>
                </article>
              }
            </div>
          } @else {
            <ui-empty-state
              [title]="'devices.detail.noServiceHistoryTitle' | transloco"
              [description]="'devices.detail.noServiceHistoryDescription' | transloco"
            />
          }
        </ui-card>

        <app-device-form-modal
          [open]="isEditDeviceModalOpen()"
          [initialValue]="editableDeviceDraft()"
          [modalTitle]="'devices.actions.edit' | transloco"
          [submitLabel]="'common.actions.saveChanges' | transloco"
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
          [title]="'devices.detail.notFoundDeviceTitle' | transloco"
          [description]="'devices.detail.notFoundDeviceDescription' | transloco"
          [actionLabel]="'devices.detail.backToDevices' | transloco"
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
  private readonly visitsStore = inject(VisitsStore);
  private readonly transloco = inject(TranslocoService);
  private readonly activeLanguage = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  protected readonly isEditDeviceModalOpen = signal(false);
  protected readonly isNextInspectionModalOpen = signal(false);
  protected readonly pendingUpdateDraft = signal<DeviceDraft | null>(null);
  protected readonly pendingUpdatePlan = signal<DeviceUpdateInspectionPlan | null>(null);
  protected readonly deviceId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('deviceId') ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('deviceId') ?? '' },
  );

  protected readonly device = computed(() => this.devicesStore.getDeviceById(this.deviceId()));
  protected readonly deviceVisits = computed(() => this.visitsStore.getVisitsForDevice(this.deviceId()));
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
    this.activeLanguage();
    const device = this.device();

    if (!device) {
      return [];
    }

    return [
      {
        labelKey: 'devices.detail.fields.brand',
        value: this.formatValue(device.brand),
      },
      {
        labelKey: 'devices.detail.fields.model',
        value: this.formatValue(device.model),
      },
      {
        labelKey: 'devices.detail.fields.installationDate',
        value: this.formatDate(device.installationDate),
      },
      {
        labelKey: 'devices.detail.fields.warrantyUntil',
        value: this.formatDate(device.warrantyUntil),
      },
      {
        labelKey: 'devices.detail.fields.serialNumber',
        value: this.formatValue(device.serialNumber),
      },
      {
        labelKey: 'devices.detail.fields.refrigerant',
        value: this.formatValue(device.refrigerant),
      },
      {
        labelKey: 'devices.detail.fields.refrigerantAmount',
        value: this.formatValue(device.refrigerantAmount),
      },
    ];
  });
  protected readonly nextInspectionDateLabel = computed(() => {
    this.activeLanguage();
    const device = this.device();

    if (!device?.hasScheduledInspections) {
      return this.transloco.translate('devices.detail.nextInspectionDisabled');
    }

    return device.nextInspectionDate
      ? this.formatDate(device.nextInspectionDate)
      : this.transloco.translate('devices.detail.noInspectionDate');
  });
  protected readonly nextInspectionStatusLabel = computed(() => {
    this.activeLanguage();
    const device = this.device();

    return device?.hasScheduledInspections
      ? this.transloco.translate('devices.detail.inspectionActive')
      : this.transloco.translate('devices.detail.inspectionSetupPrompt');
  });
  protected readonly installationFacts = computed<readonly DeviceDetailItem[]>(() => {
    this.activeLanguage();
    const device = this.device();

    if (!device) {
      return [];
    }

    return [
      {
        labelKey: 'devices.detail.fields.installationAddress',
        value: this.installationAddress(),
      },
      {
        labelKey: 'devices.detail.fields.installationPlace',
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

  protected getInspectionStatusLabel(status: InspectionStatus): string {
    return getInspectionStatusLabel(status, this.transloco);
  }
  protected readonly getInspectionStatusVariant = getInspectionStatusVariant;

  protected getVisitTypeLabel(type: VisitType): string {
    return getVisitTypeLabel(type, this.transloco);
  }

  protected visitNote(deviceId: string, visitId: string): string {
    const visit = this.deviceVisits().find((details) => details.visit.id === visitId)?.visit;

    return visit?.devicesNotes.find((item) => item.deviceId === deviceId)?.note || '--';
  }

  protected customerTitle(customer: Customer): string {
    return customer.companyName || customer.fullName || this.transloco.translate('customers.fallbackName');
  }

  protected getDeviceTypeLabel(type: DeviceDraft['type']): string {
    return readDeviceTypeLabel(type, this.transloco);
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

    return new Intl.DateTimeFormat(this.activeLanguage() === 'pl' ? 'pl-PL' : 'en-US').format(parsedDate);
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
