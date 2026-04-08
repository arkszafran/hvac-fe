import { ChangeDetectionStrategy, Component } from '@angular/core';

import { AppPlaceholderPageComponent } from '../shared/placeholder-page.component';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [AppPlaceholderPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-placeholder-page
      eyebrow="Konfiguracja"
      title="Ustawienia"
      description="Sekcja na ustawienia firmy, zespolu i preferencji systemu. Na tym etapie przygotowujemy tylko modularny kontener pod przyszle formularze."
      emptyTitle="Ustawienia sa gotowe na konfiguracje"
      emptyDescription="Tutaj w kolejnym kroku mozemy dodac profile firmy, uprawnienia, integracje i ustawienia aplikacji."
      actionLabel="Dodaj konfiguracje"
      [checklist]="checklist"
    />
  `,
})
export class SettingsPageComponent {
  protected readonly checklist = [
    'miejsce na grupy ustawien i sekcje formularzy',
    'uklad zgodny z design systemem i gotowy do skalowania',
    'spokojny placeholder bez ryzyka mieszania logiki biznesowej',
  ];
}
