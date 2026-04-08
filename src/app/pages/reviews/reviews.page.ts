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
      title="Przeglady"
      description="Szkielet pod planowanie i wykonywanie przegladow okresowych. Zostawiamy czytelne miejsce na harmonogramy i zestawy czynnosci."
      emptyTitle="Przeglady czekaja na konfiguracje"
      emptyDescription="W nastepnych iteracjach mozemy dolozyc terminy, statusy oraz powtarzalne pakiety serwisowe dla urzadzen."
      actionLabel="Dodaj harmonogram"
      [checklist]="checklist"
    />
  `,
})
export class ReviewsPageComponent {
  protected readonly checklist = [
    'miejsce na przyszly kalendarz lub widok listy przegladow',
    'card przygotowany pod bloki z typami przegladow',
    'widok pozostaje lekki i bez szczegolow biznesowych',
  ];
}
