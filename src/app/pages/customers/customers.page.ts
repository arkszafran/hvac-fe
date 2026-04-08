import { ChangeDetectionStrategy, Component } from '@angular/core';

import { AppPlaceholderPageComponent } from '../shared/placeholder-page.component';

@Component({
  selector: 'app-customers-page',
  standalone: true,
  imports: [AppPlaceholderPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-placeholder-page
      eyebrow="Relacje"
      title="Klienci"
      description="Miejsce na przyszla baze klientow i historii wspolpracy. Teraz budujemy tylko spokojny, mobilny szkielet pod dalsza rozbudowe."
      emptyTitle="Lista klientow pojawi sie tutaj"
      emptyDescription="W kolejnych etapach dodamy widok firm, osob kontaktowych i podstawowe akcje operacyjne."
      actionLabel="Dodaj liste klientow"
      [checklist]="checklist"
    />
  `,
})
export class CustomersPageComponent {
  protected readonly checklist = [
    'uklad gotowy pod wyszukiwarke i filtry',
    'miejsce na liste firm lub karty klientow',
    'spojna struktura z reszta aplikacji i routerem SPA',
  ];
}
