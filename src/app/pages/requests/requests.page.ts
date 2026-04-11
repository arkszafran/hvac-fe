import { ChangeDetectionStrategy, Component } from '@angular/core';

import { AppPlaceholderPageComponent } from '../shared/placeholder-page.component';

@Component({
  selector: 'app-requests-page',
  standalone: true,
  imports: [AppPlaceholderPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-placeholder-page
      eyebrow="Obsługa zgłoszeń"
      title="Zgłoszenia"
      description="Sekcja przewidziana pod przyjmowanie nowych spraw i obsługę prac serwisowych. Na razie zostaje czysty placeholder bez danych."
      emptyTitle="Zgłoszenia są jeszcze puste"
      emptyDescription="Później dodamy tu statusy, priorytety, terminy oraz przepływ pracy dla techników i biura."
      actionLabel="Dodaj workflow"
      [checklist]="checklist"
    />
  `,
})
export class RequestsPageComponent {
  protected readonly checklist = [
    'nagłówek przygotowany pod filtry statusów i priorytety',
    'obszar listy gotowy na przyszły backlog zgłoszeń',
    'mobile first layout z prostymi odstępami i czytelnym rytmem',
  ];
}
