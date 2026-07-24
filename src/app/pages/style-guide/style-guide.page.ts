import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import {
  UiBadgeComponent,
  UiButtonComponent,
  UiCardComponent,
  UiDrawerComponent,
  UiEmptyStateComponent,
  UiInputComponent,
  UiModalComponent,
  UiPageHeaderComponent,
  UiSelectComponent,
  UiSelectOption,
  UiTableColumn,
  UiTableComponent,
  UiTabItem,
  UiTabsComponent,
} from '../../ui';

interface StyleGuideJobRow {
  id: string;
  client: string;
  location: string;
  service: string;
  schedule: string;
  scheduleNote: string;
  technician: string;
  status: string;
  amount: string;
}

@Component({
  selector: 'app-style-guide-page',
  standalone: true,
  imports: [
    FormsModule,
    TranslocoPipe,
    UiBadgeComponent,
    UiButtonComponent,
    UiCardComponent,
    UiDrawerComponent,
    UiEmptyStateComponent,
    UiInputComponent,
    UiModalComponent,
    UiPageHeaderComponent,
    UiSelectComponent,
    UiTableComponent,
    UiTabsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './style-guide.page.html',
})
export class StyleGuidePageComponent {
  private readonly transloco = inject(TranslocoService);
  private readonly activeLanguage = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  protected readonly swatches = computed(() => {
    this.activeLanguage();

    return [
      { name: 'Background', note: this.transloco.translate('pages.styleGuide.swatches.background'), color: 'var(--color-background)' },
      { name: 'Surface', note: this.transloco.translate('pages.styleGuide.swatches.surface'), color: 'var(--color-surface)' },
      { name: 'Primary', note: this.transloco.translate('pages.styleGuide.swatches.primary'), color: 'var(--color-primary)' },
      { name: 'Accent', note: this.transloco.translate('pages.styleGuide.swatches.accent'), color: 'var(--color-accent)' },
      { name: 'Text Main', note: this.transloco.translate('pages.styleGuide.swatches.textMain'), color: 'var(--color-text-main)' },
      { name: 'Border', note: this.transloco.translate('pages.styleGuide.swatches.border'), color: 'var(--color-border)' },
    ];
  });

  protected readonly tabs = computed<UiTabItem[]>(() => {
    this.activeLanguage();

    return [
      { id: 'overview', label: this.transloco.translate('pages.styleGuide.tabs.overview'), count: 12 },
      { id: 'schedule', label: this.transloco.translate('pages.styleGuide.tabs.schedule'), count: 7 },
      { id: 'billing', label: this.transloco.translate('pages.styleGuide.tabs.billing'), count: 3 },
    ];
  });

  protected readonly visitTypeOptions = computed<UiSelectOption[]>(() => {
    this.activeLanguage();

    return [
      { value: 'serwis', label: this.transloco.translate('visits.types.repair') },
      { value: 'przeglad', label: this.transloco.translate('visits.types.inspection') },
      { value: 'montaz', label: this.transloco.translate('visits.types.installation') },
    ];
  });

  protected readonly regionOptions = computed<UiSelectOption[]>(() => {
    this.activeLanguage();

    return [
      { value: 'warszawa', label: this.transloco.translate('pages.styleGuide.regions.warsaw') },
      { value: 'lodz', label: this.transloco.translate('pages.styleGuide.regions.lodz') },
      { value: 'krakow', label: this.transloco.translate('pages.styleGuide.regions.krakow') },
    ];
  });

  protected readonly jobsTableColumns = computed<UiTableColumn<StyleGuideJobRow>[]>(() => {
    this.activeLanguage();

    return [
      {
        id: 'client',
        header: this.transloco.translate('customers.table.client'),
        key: 'client',
        description: (row) => row.location,
        width: '22%',
      },
      {
        id: 'service',
        header: this.transloco.translate('pages.styleGuide.jobs.headers.scope'),
        key: 'service',
        width: '24%',
      },
      {
        id: 'schedule',
        header: this.transloco.translate('pages.styleGuide.jobs.headers.schedule'),
        key: 'schedule',
        description: (row) => row.scheduleNote,
        width: '18%',
      },
      {
        id: 'technician',
        header: this.transloco.translate('pages.styleGuide.jobs.headers.technician'),
        key: 'technician',
        width: '16%',
      },
      {
        id: 'status',
        header: this.transloco.translate('serviceOrders.fields.status'),
        key: 'status',
        type: 'badge',
        align: 'center',
        badgeVariant: (value) => this.resolveStatusVariant(value),
        width: '12%',
      },
      {
        id: 'amount',
        header: this.transloco.translate('pages.styleGuide.jobs.headers.amount'),
        key: 'amount',
        align: 'end',
        width: '8%',
      },
    ];
  });

  protected readonly jobsTableRows = computed<StyleGuideJobRow[]>(() => {
    this.activeLanguage();

    return [
      {
        id: 'job-01',
        client: 'Atrium One',
        location: 'Warszawa, ul. Prosta 18',
        service: this.transloco.translate('pages.styleGuide.jobs.job01.service'),
        schedule: this.transloco.translate('pages.styleGuide.jobs.job01.schedule'),
        scheduleNote: this.transloco.translate('pages.styleGuide.jobs.job01.note'),
        technician: 'M. Kurek',
        status: this.transloco.translate('pages.styleGuide.jobs.status.planned'),
        amount: this.transloco.translate('pages.styleGuide.jobs.job01.amount'),
      },
      {
        id: 'job-02',
        client: 'Skylab Logistics',
        location: this.transloco.translate('pages.styleGuide.jobs.job02.location'),
        service: this.transloco.translate('pages.styleGuide.jobs.job02.service'),
        schedule: this.transloco.translate('pages.styleGuide.jobs.job02.schedule'),
        scheduleNote: this.transloco.translate('pages.styleGuide.jobs.job02.note'),
        technician: 'A. Maj',
        status: this.transloco.translate('pages.styleGuide.jobs.status.onRoute'),
        amount: this.transloco.translate('pages.styleGuide.jobs.job02.amount'),
      },
      {
        id: 'job-03',
        client: 'Blue Point Offices',
        location: this.transloco.translate('pages.styleGuide.jobs.job03.location'),
        service: this.transloco.translate('pages.styleGuide.jobs.job03.service'),
        schedule: this.transloco.translate('pages.styleGuide.jobs.job03.schedule'),
        scheduleNote: this.transloco.translate('pages.styleGuide.jobs.job03.note'),
        technician: 'K. Wrona',
        status: this.transloco.translate('pages.styleGuide.jobs.status.waiting'),
        amount: this.transloco.translate('pages.styleGuide.jobs.job03.amount'),
      },
      {
        id: 'job-04',
        client: 'NovaMed',
        location: this.transloco.translate('pages.styleGuide.jobs.job04.location'),
        service: this.transloco.translate('pages.styleGuide.jobs.job04.service'),
        schedule: this.transloco.translate('pages.styleGuide.jobs.job04.schedule'),
        scheduleNote: this.transloco.translate('pages.styleGuide.jobs.job04.note'),
        technician: 'P. Zawada',
        status: this.transloco.translate('pages.styleGuide.jobs.status.completed'),
        amount: this.transloco.translate('pages.styleGuide.jobs.job04.amount'),
      },
    ];
  });

  protected readonly activeTab = signal('overview');
  protected readonly isModalOpen = signal(false);
  protected readonly isDrawerOpen = signal(false);

  protected jobName = '';
  protected contactPerson = '';
  protected phoneNumber = '';
  protected visitType = 'serwis';
  protected modalCompany = '';
  protected modalCity = '';
  protected selectedRegion = 'warszawa';
  protected selectedVisitType = 'serwis';

  protected resetDrawerFilters(): void {
    this.selectedRegion = '';
    this.selectedVisitType = '';
  }

  private resolveStatusVariant(value: string): 'info' | 'warning' | 'success' | 'neutral' {
    switch (value) {
      case this.transloco.translate('pages.styleGuide.jobs.status.planned'):
        return 'info';
      case this.transloco.translate('pages.styleGuide.jobs.status.onRoute'):
        return 'warning';
      case this.transloco.translate('pages.styleGuide.jobs.status.completed'):
        return 'success';
      default:
        return 'neutral';
    }
  }
}
