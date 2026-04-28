import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { UiBadgeComponent, UiButtonComponent, UiModalComponent } from '../../../ui';
import { Inspection } from '../models/inspection.model';
import {
  formatInspectionDate,
  formatInspectionWindow,
  getInspectionStatusLabel,
  getInspectionStatusVariant,
} from '../utils/inspection-ui.util';

@Component({
  selector: 'app-inspection-candidate-picker-modal',
  standalone: true,
  imports: [UiBadgeComponent, UiButtonComponent, UiModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-modal
      [open]="open()"
      [title]="title()"
      [description]="description()"
      (close)="close.emit()"
    >
      <div class="space-y-4">
        <div class="rounded-[1rem] border border-border/80 bg-surface/62 p-4">
          <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
            Klient
          </p>
          <p class="mt-2 text-h3 tracking-[-0.02em] text-text-main">{{ customerName() }}</p>
          <p class="mt-1 text-body text-text-muted">{{ deviceName() }}</p>
        </div>

        @if (candidates().length) {
          <div class="space-y-3">
            @for (inspection of candidates(); track inspection.id) {
              <article class="rounded-[1rem] border border-border/85 bg-white p-4 shadow-card">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div class="flex flex-wrap items-center gap-3">
                    <ui-badge [variant]="getInspectionStatusVariant(inspection.status)">
                      {{ getInspectionStatusLabel(inspection.status) }}
                    </ui-badge>
                    <span class="text-small text-text-muted">
                      {{ inspection.deviceIds.length }} urzadzenia
                    </span>
                  </div>

                  <ui-button
                    type="button"
                    size="sm"
                    variant="secondary"
                    (pressed)="inspectionSelected.emit(inspection.id)"
                  >
                    Wybierz ten przeglad
                  </ui-button>
                </div>

                <dl class="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <dt class="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                      Planowany termin
                    </dt>
                    <dd class="mt-1 text-label text-text-main">
                      {{ formatInspectionWindow(inspection.windowStart, inspection.windowEnd) }}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                      Termin przeglądu
                    </dt>
                    <dd class="mt-1 text-label text-text-main">
                      {{ formatInspectionDate(inspection.plannedDate || inspection.targetDate) }}
                    </dd>
                  </div>
                </dl>
              </article>
            }
          </div>
        } @else {
          <div class="rounded-[1rem] border border-dashed border-border/90 bg-white/72 p-5 text-body text-text-muted">
            Brak innych pasujacych przegladow. Mozesz utworzyc nowy obiekt albo cofnac zmiane.
          </div>
        }
      </div>

      <div modal-footer class="grid gap-3 sm:grid-cols-2">
        <ui-button type="button" variant="ghost" [block]="true" (pressed)="close.emit()">
          {{ cancelActionLabel() }}
        </ui-button>
        <ui-button type="button" [block]="true" (pressed)="createNew.emit()">
          {{ createActionLabel() }}
        </ui-button>
      </div>
    </ui-modal>
  `,
})
export class InspectionCandidatePickerModalComponent {
  readonly open = input(false);
  readonly title = input('Wybierz przeglad');
  readonly description = input('');
  readonly customerName = input('');
  readonly deviceName = input('');
  readonly candidates = input<Inspection[]>([]);
  readonly createActionLabel = input('Utworz nowy przeglad');
  readonly cancelActionLabel = input('Anuluj');

  readonly inspectionSelected = output<string>();
  readonly createNew = output<void>();
  readonly close = output<void>();

  protected readonly formatInspectionDate = formatInspectionDate;
  protected readonly formatInspectionWindow = formatInspectionWindow;
  protected readonly getInspectionStatusLabel = getInspectionStatusLabel;
  protected readonly getInspectionStatusVariant = getInspectionStatusVariant;
}
