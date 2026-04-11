import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

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
  protected readonly swatches = [
    { name: 'Background', note: 'Chłodne, czyste tło aplikacji', color: 'var(--color-background)' },
    { name: 'Surface', note: 'Sekcje, karty i nakładki', color: 'var(--color-surface)' },
    { name: 'Primary', note: 'Główny CTA w chłodnym granacie', color: 'var(--color-primary)' },
    { name: 'Accent', note: 'Pomarańczowy akcent dla priorytetów', color: 'var(--color-accent)' },
    { name: 'Text Main', note: 'Mocniejsza hierarchia typografii', color: 'var(--color-text-main)' },
    { name: 'Border', note: 'Czytelniejszy podział sekcji', color: 'var(--color-border)' },
  ];

  protected readonly tabs: UiTabItem[] = [
    { id: 'overview', label: 'Przegląd', count: 12 },
    { id: 'schedule', label: 'Harmonogram', count: 7 },
    { id: 'billing', label: 'Rozliczenia', count: 3 },
  ];

  protected readonly visitTypeOptions: UiSelectOption[] = [
    { value: 'serwis', label: 'Serwis' },
    { value: 'przeglad', label: 'Przegląd okresowy' },
    { value: 'montaz', label: 'Montaż' },
  ];

  protected readonly regionOptions: UiSelectOption[] = [
    { value: 'warszawa', label: 'Warszawa' },
    { value: 'lodz', label: 'Łódź' },
    { value: 'krakow', label: 'Kraków' },
  ];

  protected readonly jobsTableColumns: UiTableColumn<StyleGuideJobRow>[] = [
    {
      id: 'client',
      header: 'Klient',
      key: 'client',
      description: (row) => row.location,
      width: '22%',
    },
    {
      id: 'service',
      header: 'Zakres',
      key: 'service',
      width: '24%',
    },
    {
      id: 'schedule',
      header: 'Termin',
      key: 'schedule',
      description: (row) => row.scheduleNote,
      width: '18%',
    },
    {
      id: 'technician',
      header: 'Technik',
      key: 'technician',
      width: '16%',
    },
    {
      id: 'status',
      header: 'Status',
      key: 'status',
      type: 'badge',
      align: 'center',
      badgeVariant: (value) => this.resolveStatusVariant(value),
      width: '12%',
    },
    {
      id: 'amount',
      header: 'Kwota',
      key: 'amount',
      align: 'end',
      width: '8%',
    },
  ];

  protected readonly jobsTableRows: StyleGuideJobRow[] = [
    {
      id: 'job-01',
      client: 'Atrium One',
      location: 'Warszawa, ul. Prosta 18',
      service: 'Przegląd VRF i czyszczenie jednostek',
      schedule: '08 kwi, 08:30',
      scheduleNote: '2 techników, wejście od recepcji',
      technician: 'M. Kurek',
      status: 'Zaplanowane',
      amount: '2 480 zł',
    },
    {
      id: 'job-02',
      client: 'Skylab Logistics',
      location: 'Łódź, ul. Sanitariuszek 72',
      service: 'Diagnostyka centrali nawiewnej',
      schedule: '08 kwi, 11:00',
      scheduleNote: 'Priorytet SLA 4h',
      technician: 'A. Maj',
      status: 'W trasie',
      amount: '1 190 zł',
    },
    {
      id: 'job-03',
      client: 'Blue Point Offices',
      location: 'Kraków, ul. Lubicz 23',
      service: 'Wymiana sterownika i test wydajności',
      schedule: '08 kwi, 14:30',
      scheduleNote: 'Wymagana akceptacja administratora',
      technician: 'K. Wrona',
      status: 'Oczekuje',
      amount: '3 760 zł',
    },
    {
      id: 'job-04',
      client: 'NovaMed',
      location: 'Warszawa, ul. Wołoska 9',
      service: 'Kalibracja czujników i raport powykonawczy',
      schedule: '09 kwi, 09:15',
      scheduleNote: 'Dokumentacja dla audytu',
      technician: 'P. Zawada',
      status: 'Zakończone',
      amount: '980 zł',
    },
  ];

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
      case 'Zaplanowane':
        return 'info';
      case 'W trasie':
        return 'warning';
      case 'Zakończone':
        return 'success';
      default:
        return 'neutral';
    }
  }
}
