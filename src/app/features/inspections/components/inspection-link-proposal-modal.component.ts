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
  selector: 'app-inspection-link-proposal-modal',
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
      @if (inspection(); as inspection) {
        <div class="space-y-4">
          <div class="rounded-[1rem] border border-border/80 bg-surface/62 p-4">
            <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
              Klient
            </p>
            <p class="mt-2 text-h3 tracking-[-0.02em] text-text-main">{{ customerName() }}</p>
            <p class="mt-1 text-body text-text-muted">{{ deviceName() }}</p>
          </div>

          <div class="rounded-[1rem] border border-border/80 bg-white p-4 shadow-card">
            <div class="flex flex-wrap items-center gap-3">
              <ui-badge [variant]="getInspectionStatusVariant(inspection.status)">
                {{ getInspectionStatusLabel(inspection.status) }}
              </ui-badge>
              <span class="text-small text-text-muted">
                {{ inspection.deviceIds.length }} urządzenia w przeglądzie
              </span>
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
          </div>
        </div>
      }

      <div modal-footer class="grid gap-3 sm:grid-cols-3">
        <ui-button type="button" variant="ghost" [block]="true" (pressed)="close.emit()">
          {{ cancelLabel() }}
        </ui-button>
        <ui-button type="button" variant="secondary" [block]="true" (pressed)="createSeparate.emit()">
          {{ secondaryActionLabel() }}
        </ui-button>
        <ui-button type="button" [block]="true" (pressed)="confirm.emit()">
          {{ primaryActionLabel() }}
        </ui-button>
      </div>
    </ui-modal>
  `,
})
export class InspectionLinkProposalModalComponent {
  readonly open = input(false);
  readonly title = input('Dołączyć do przeglądu?');
  readonly description = input('');
  readonly customerName = input('');
  readonly deviceName = input('');
  readonly inspection = input<Inspection | null>(null);
  readonly primaryActionLabel = input('Dołącz');
  readonly secondaryActionLabel = input('Utwórz osobny przegląd');
  readonly cancelLabel = input('Anuluj');

  readonly confirm = output<void>();
  readonly createSeparate = output<void>();
  readonly close = output<void>();

  protected readonly formatInspectionDate = formatInspectionDate;
  protected readonly formatInspectionWindow = formatInspectionWindow;
  protected readonly getInspectionStatusLabel = getInspectionStatusLabel;
  protected readonly getInspectionStatusVariant = getInspectionStatusVariant;
}
