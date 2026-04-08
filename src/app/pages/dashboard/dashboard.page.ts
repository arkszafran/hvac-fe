import { ChangeDetectionStrategy, Component } from '@angular/core';

import { AppPlaceholderPageComponent } from '../shared/placeholder-page.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [AppPlaceholderPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-placeholder-page
      eyebrow="Start pracy"
      title="Dashboard"
      description="Lekki ekran startowy pod codzienna prace firmy HVAC. Na tym etapie zostawiamy tylko czytelny szkielet i miejsce na przyszle widzety."
      emptyTitle="Dashboard czeka na pierwsze widoki"
      emptyDescription="Tu pojawia sie pozniej podsumowanie dnia, szybkie akcje i najwazniejsze statusy zespolu."
      actionLabel="Dodaj widgety"
      [checklist]="checklist"
    />
  `,
})
export class DashboardPageComponent {
  protected readonly checklist = [
    'naglowek sekcji gotowy pod KPI i szybkie akcje',
    'obszar glownej zawartosci przygotowany pod widgety',
    'placeholder bez danych biznesowych i bez logiki backendowej',
  ];
}
