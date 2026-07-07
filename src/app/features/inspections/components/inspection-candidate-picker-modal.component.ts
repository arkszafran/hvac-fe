import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

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
  imports: [TranslocoPipe, UiBadgeComponent, UiButtonComponent, UiModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-modal
      [open]="open()"
      [title]="modalTitle()"
      [description]="description()"
      (close)="close.emit()"
    >
      <div class="space-y-4">
        <div class="rounded-[1rem] border border-border/80 bg-surface/62 p-4">
          <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
            {{ 'inspections.fields.customer' | transloco }}
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
                      {{ 'inspections.detail.deviceCount' | transloco: { count: inspection.deviceIds.length } }}
                    </span>
                  </div>

                  <ui-button
                    type="button"
                    size="sm"
                    variant="secondary"
                    (pressed)="inspectionSelected.emit(inspection.id)"
                  >
                    {{ 'inspections.actions.selectInspection' | transloco }}
                  </ui-button>
                </div>

                <dl class="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <dt class="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                      {{ 'inspections.fields.plannedDate' | transloco }}
                    </dt>
                    <dd class="mt-1 text-label text-text-main">
                      {{ formatInspectionWindow(inspection.windowStart, inspection.windowEnd) }}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                      {{ 'inspections.fields.inspectionDate' | transloco }}
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
            {{ 'inspections.candidatePicker.empty' | transloco }}
          </div>
        }
      </div>

      <div modal-footer class="grid gap-3 sm:grid-cols-2">
        <ui-button type="button" variant="ghost" [block]="true" (pressed)="close.emit()">
          {{ closeLabel() }}
        </ui-button>
        <ui-button type="button" [block]="true" (pressed)="createNew.emit()">
          {{ createLabel() }}
        </ui-button>
      </div>
    </ui-modal>
  `,
})
export class InspectionCandidatePickerModalComponent {
  private readonly transloco = inject(TranslocoService);

  readonly open = input(false);
  readonly title = input('');
  readonly description = input('');
  readonly customerName = input('');
  readonly deviceName = input('');
  readonly candidates = input<Inspection[]>([]);
  readonly createActionLabel = input('');
  readonly cancelActionLabel = input('');

  readonly inspectionSelected = output<string>();
  readonly createNew = output<void>();
  readonly close = output<void>();

  protected readonly formatInspectionDate = formatInspectionDate;
  protected readonly formatInspectionWindow = formatInspectionWindow;
  protected readonly getInspectionStatusVariant = getInspectionStatusVariant;

  protected modalTitle(): string {
    return this.title() || this.transloco.translate('inspections.candidatePicker.defaultTitle');
  }

  protected createLabel(): string {
    return this.createActionLabel() || this.transloco.translate('inspections.candidatePicker.createAction');
  }

  protected closeLabel(): string {
    return this.cancelActionLabel() || this.transloco.translate('common.actions.cancel');
  }

  protected getInspectionStatusLabel(status: Inspection['status']): string {
    return getInspectionStatusLabel(status, this.transloco);
  }
}
