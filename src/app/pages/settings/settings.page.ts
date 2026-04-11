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
      description="Sekcja na ustawienia firmy, zespołu i preferencji systemu. Na tym etapie przygotowujemy tylko modularny kontener pod przyszłe formularze."
      emptyTitle="Ustawienia są gotowe na konfigurację"
      emptyDescription="Tutaj w kolejnym kroku możemy dodać profile firmy, uprawnienia, integracje i ustawienia aplikacji."
      actionLabel="Dodaj konfigurację"
      [checklist]="checklist"
    />
  `,
})
export class SettingsPageComponent {
  protected readonly checklist = [
    'miejsce na grupy ustawień i sekcje formularzy',
    'układ zgodny z design systemem i gotowy do skalowania',
    'spokojny placeholder bez ryzyka mieszania logiki biznesowej',
  ];
}
