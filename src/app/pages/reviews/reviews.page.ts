import { ChangeDetectionStrategy, Component } from '@angular/core';

import { AppPlaceholderPageComponent } from '../shared/placeholder-page.component';

@Component({
  selector: 'app-reviews-page',
  standalone: true,
  imports: [AppPlaceholderPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-placeholder-page
      eyebrow="Prace okresowe"
      title="Przeglądy"
      description="Szkielet pod planowanie i wykonywanie przeglądów okresowych. Zostawiamy czytelne miejsce na harmonogramy i zestawy czynności."
      emptyTitle="Przeglądy czekają na konfigurację"
      emptyDescription="W następnych iteracjach możemy dołożyć terminy, statusy oraz powtarzalne pakiety serwisowe dla urządzeń."
      actionLabel="Dodaj harmonogram"
      [checklist]="checklist"
    />
  `,
})
export class ReviewsPageComponent {
  protected readonly checklist = [
    'miejsce na przyszły kalendarz lub widok listy przeglądów',
    'card przygotowany pod bloki z typami przeglądów',
    'widok pozostaje lekki i bez szczegółów biznesowych',
  ];
}
