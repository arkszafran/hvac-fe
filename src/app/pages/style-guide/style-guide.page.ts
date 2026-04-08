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
  UiTabItem,
  UiTabsComponent,
} from '../../ui';

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
    UiTabsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ui-page min-h-screen">
      <div class="ui-shell py-6 md:py-8 lg:py-10">
        <div class="ui-panel p-5 sm:p-6 lg:p-8">
          <ui-page-header
            eyebrow="HAVAC UI"
            title="Spokojny design system dla nowoczesnego SaaS"
            description="Lzejsza, bardziej premium estetyka: jasne neutrals, czysty niebieski akcent i spokojny rytm interfejsu. Calosc jest mobile first i gotowa pod operacyjna aplikacje HVAC."
          >
            <div header-action class="flex items-center gap-3">
              <ui-badge variant="neutral">Apple-inspired</ui-badge>
              <ui-button>Nowe zlecenie</ui-button>
            </div>
          </ui-page-header>

          <section class="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div
              class="rounded-[1.75rem] border border-white/75 bg-[linear-gradient(180deg,_rgb(255_255_255/0.9),_rgb(255_255_255/0.72))] p-5 shadow-card backdrop-blur-xl sm:p-6"
            >
              <div class="flex flex-wrap items-center gap-3">
                <ui-badge variant="info">Lightweight</ui-badge>
                <ui-badge variant="neutral">Readable on mobile</ui-badge>
                <ui-badge variant="success">Production-ready base</ui-badge>
              </div>

              <div class="mt-6 grid gap-4 sm:grid-cols-3">
                @for (swatch of swatches; track swatch.name) {
                  <div class="rounded-[1.35rem] border border-black/6 bg-white/72 p-4">
                    <div class="h-16 rounded-[1.1rem]" [style.background]="swatch.color"></div>
                    <p class="mt-3 text-label text-text-main">{{ swatch.name }}</p>
                    <p class="text-small text-text-muted">{{ swatch.note }}</p>
                  </div>
                }
              </div>
            </div>

            <ui-card>
              <div card-header class="space-y-1">
                <p class="ui-kicker">Typography</p>
                <h2 class="text-h2 tracking-[-0.025em] text-text-main">Calmer hierarchy</h2>
              </div>

              <div class="space-y-4">
                <div>
                  <p class="text-display tracking-[-0.04em] text-text-main">Display 30/36</p>
                  <p class="text-small text-text-muted">Hero headlines and top-level screens</p>
                </div>
                <div>
                  <p class="text-h1 tracking-[-0.03em] text-text-main">H1 24/32</p>
                  <p class="text-small text-text-muted">Page level titles</p>
                </div>
                <div>
                  <p class="text-h2 tracking-[-0.02em] text-text-main">H2 20/28</p>
                  <p class="text-small text-text-muted">Cards, sections, grouped content</p>
                </div>
                <div>
                  <p class="text-body-lg text-text-main">
                    Body large stays soft and legible, especially on compact mobile screens.
                  </p>
                  <p class="text-body text-text-muted">
                    Labels and helper text now sit closer to the field, while the gaps between
                    fields are cleaner and more intentional.
                  </p>
                </div>
              </div>
            </ui-card>
          </section>
        </div>

        <section class="mt-8 space-y-4">
          <div class="space-y-1">
            <p class="ui-kicker">Buttons and status</p>
            <h2 class="text-h2 tracking-[-0.025em] text-text-main">
              Softer actions, quieter chrome
            </h2>
          </div>

          <div class="ui-demo-grid">
            <ui-card>
              <div class="flex flex-wrap gap-3">
                <ui-button>Dodaj klienta</ui-button>
                <ui-button variant="secondary">Zapisz szkic</ui-button>
                <ui-button variant="ghost">Pokaz szczegoly</ui-button>
                <ui-button variant="danger">Usun wpis</ui-button>
              </div>

              <div class="mt-5 flex flex-wrap gap-3">
                <ui-badge>Neutral</ui-badge>
                <ui-badge variant="info">Info</ui-badge>
                <ui-badge variant="success">Success</ui-badge>
                <ui-badge variant="warning">Warning</ui-badge>
                <ui-badge variant="danger">Danger</ui-badge>
              </div>
            </ui-card>

            <ui-card>
              <pre class="ui-code"><code>&lt;ui-button&gt;Dodaj klienta&lt;/ui-button&gt;
&lt;ui-button variant="secondary"&gt;Zapisz szkic&lt;/ui-button&gt;
&lt;ui-badge variant="info"&gt;Info&lt;/ui-badge&gt;</code></pre>
            </ui-card>
          </div>
        </section>

        <section class="mt-8 space-y-4">
          <div class="space-y-1">
            <p class="ui-kicker">Forms</p>
            <h2 class="text-h2 tracking-[-0.025em] text-text-main">
              Corrected spacing and cleaner fields
            </h2>
          </div>

          <div class="ui-demo-grid">
            <ui-card>
              <div card-header class="space-y-1">
                <h3 class="text-h3 tracking-[-0.02em] text-text-main">Formularz zlecenia</h3>
                <p class="text-body text-text-muted">
                  Labels, helper text and field gaps are now aligned into one vertical rhythm.
                </p>
              </div>

              <div class="ui-form-stack">
                <ui-input
                  label="Nazwa zlecenia"
                  placeholder="np. Przeglad klimatyzacji biura"
                  hint="Ta nazwe zobaczy technik w aplikacji mobilnej."
                  [(ngModel)]="jobName"
                />

                <ui-input
                  label="Osoba kontaktowa"
                  placeholder="np. Anna Kowalska"
                  [(ngModel)]="contactPerson"
                />

                <ui-select
                  label="Typ wizyty"
                  placeholder="Wybierz typ"
                  [options]="visitTypeOptions"
                  [(ngModel)]="visitType"
                />

                <ui-input
                  label="Telefon"
                  type="tel"
                  placeholder="+48 500 000 000"
                  error="Wprowadz numer telefonu w poprawnym formacie."
                  [(ngModel)]="phoneNumber"
                />
              </div>
            </ui-card>

            <ui-card>
              <div card-header class="space-y-1">
                <h3 class="text-h3 tracking-[-0.02em] text-text-main">Page header and tabs</h3>
                <p class="text-body text-text-muted">
                  The navigation pieces now feel more airy and less admin-panel heavy.
                </p>
              </div>

              <ui-tabs
                [tabs]="tabs"
                [activeId]="activeTab()"
                (activeIdChange)="activeTab.set($event)"
              />

              <div class="mt-5 rounded-[1.5rem] border border-black/6 bg-white/72 p-4 sm:p-5">
                @switch (activeTab()) {
                  @case ('overview') {
                    <p class="text-label text-text-main">Przeglad dnia</p>
                    <p class="mt-1 text-body text-text-muted">
                      Najwazniejsze zadania, priorytety i aktywne ekipy.
                    </p>
                  }
                  @case ('schedule') {
                    <p class="text-label text-text-main">Harmonogram</p>
                    <p class="mt-1 text-body text-text-muted">
                      Widok ulozenia wizyt i obciazenia zespolu.
                    </p>
                  }
                  @default {
                    <p class="text-label text-text-main">Rozliczenia</p>
                    <p class="mt-1 text-body text-text-muted">
                      Status faktur, zaliczek i oczekujacych platnosci.
                    </p>
                  }
                }
              </div>
            </ui-card>
          </div>
        </section>

        <section class="mt-8 grid gap-5 lg:grid-cols-[1fr_0.92fr]">
          <ui-card>
            <div card-header class="space-y-1">
              <h3 class="text-h3 tracking-[-0.02em] text-text-main">Modal and drawer</h3>
              <p class="text-body text-text-muted">
                Lightweight overlays for quick actions, filters and mobile-first flows.
              </p>
            </div>

            <div class="flex flex-wrap gap-3">
              <ui-button (pressed)="isModalOpen.set(true)">Otworz modal</ui-button>
              <ui-button variant="secondary" (pressed)="isDrawerOpen.set(true)">
                Otworz drawer
              </ui-button>
            </div>
          </ui-card>

          <ui-empty-state
            title="Brak aktywnych przegladow sezonowych"
            description="Po dodaniu pierwszego szablonu zobaczysz tutaj zestawy zadan, statusy ekip i szybkie akcje."
            actionLabel="Dodaj pierwszy szablon"
          />
        </section>
      </div>

      <ui-modal
        [open]="isModalOpen()"
        title="Dodaj klienta"
        description="Delikatny modal do szybkiego rozpoczecia zlecenia lub utworzenia nowej firmy."
        (close)="isModalOpen.set(false)"
      >
        <div class="ui-form-stack">
          <ui-input
            label="Nazwa firmy"
            placeholder="np. Klima Serwis Sp. z o.o."
            [(ngModel)]="modalCompany"
          />
          <ui-input label="Miasto" placeholder="Warszawa" [(ngModel)]="modalCity" />
        </div>

        <div modal-footer class="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <ui-button variant="ghost" (pressed)="isModalOpen.set(false)">Anuluj</ui-button>
          <ui-button (pressed)="isModalOpen.set(false)">Zapisz klienta</ui-button>
        </div>
      </ui-modal>

      <ui-drawer
        [open]="isDrawerOpen()"
        title="Filtry harmonogramu"
        description="Przyklad spokojnego sheetu pod mobilne filtrowanie widoku pracy."
        (close)="isDrawerOpen.set(false)"
      >
        <div class="ui-form-stack">
          <ui-select label="Region" [options]="regionOptions" [(ngModel)]="selectedRegion" />
          <ui-select
            label="Typ zadania"
            [options]="visitTypeOptions"
            [(ngModel)]="selectedVisitType"
          />

          <div class="rounded-[1.5rem] border border-black/6 bg-white/72 p-4">
            <p class="text-label text-text-main">Aktywne filtry</p>
            <div class="mt-3 flex flex-wrap gap-2">
              <ui-badge variant="info">{{ selectedRegion || 'Wszystkie regiony' }}</ui-badge>
              <ui-badge variant="neutral">{{ selectedVisitType || 'Wszystkie typy' }}</ui-badge>
            </div>
          </div>
        </div>

        <div drawer-footer class="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <ui-button variant="ghost" (pressed)="resetDrawerFilters()">Wyczysc</ui-button>
          <ui-button variant="secondary" (pressed)="isDrawerOpen.set(false)">
            Zastosuj filtry
          </ui-button>
        </div>
      </ui-drawer>
    </div>
  `,
})
export class StyleGuidePageComponent {
  protected readonly swatches = [
    { name: 'Background', note: 'Soft app canvas', color: 'var(--color-background)' },
    { name: 'Surface', note: 'Cards and overlays', color: 'var(--color-surface)' },
    { name: 'Primary', note: 'Main CTA blue', color: 'var(--color-primary)' },
    { name: 'Primary Soft', note: 'Subtle highlights', color: 'var(--color-primary-soft)' },
    { name: 'Text Main', note: 'High readability', color: 'var(--color-text-main)' },
    { name: 'Border', note: 'Low-contrast structure', color: 'var(--color-border)' },
  ];

  protected readonly tabs: UiTabItem[] = [
    { id: 'overview', label: 'Przeglad', count: 12 },
    { id: 'schedule', label: 'Harmonogram', count: 7 },
    { id: 'billing', label: 'Rozliczenia', count: 3 },
  ];

  protected readonly visitTypeOptions: UiSelectOption[] = [
    { value: 'serwis', label: 'Serwis' },
    { value: 'przeglad', label: 'Przeglad okresowy' },
    { value: 'montaz', label: 'Montaz' },
  ];

  protected readonly regionOptions: UiSelectOption[] = [
    { value: 'warszawa', label: 'Warszawa' },
    { value: 'lodz', label: 'Lodz' },
    { value: 'krakow', label: 'Krakow' },
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
}
