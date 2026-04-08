import { ChangeDetectionStrategy, Component } from '@angular/core';

import { AppPlaceholderPageComponent } from '../shared/placeholder-page.component';

@Component({
  selector: 'app-requests-page',
  standalone: true,
  imports: [AppPlaceholderPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-placeholder-page
      eyebrow="Obsluga zgloszen"
      title="Zgloszenia"
      description="Sekcja przewidziana pod przyjmowanie nowych spraw i obsluge prac serwisowych. Na razie zostaje czysty placeholder bez danych."
      emptyTitle="Zgloszenia sa jeszcze puste"
      emptyDescription="Pozniej dodamy tu statusy, priorytety, terminy oraz przeplyw pracy dla technikow i biura."
      actionLabel="Dodaj workflow"
      [checklist]="checklist"
    />
  `,
})
export class RequestsPageComponent {
  protected readonly checklist = [
    'naglowek przygotowany pod filtry statusow i priorytety',
    'obszar listy gotowy na przyszly backlog zgloszen',
    'mobile first layout z prostymi odstepami i czytelnym rytmem',
  ];
}
