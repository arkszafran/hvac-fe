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
      description="Lekki ekran startowy pod codzienną pracę firmy HVAC. Na tym etapie zostawiamy tylko czytelny szkielet i miejsce na przyszłe widżety."
      emptyTitle="Dashboard czeka na pierwsze widoki"
      emptyDescription="Tu pojawi się później podsumowanie dnia, szybkie akcje i najważniejsze statusy zespołu."
      actionLabel="Dodaj widgety"
      [checklist]="checklist"
    />
  `,
})
export class DashboardPageComponent {
  protected readonly checklist = [
    'nagłówek sekcji gotowy pod KPI i szybkie akcje',
    'obszar głównej zawartości przygotowany pod widgety',
    'placeholder bez danych biznesowych i bez logiki backendowej',
  ];
}
