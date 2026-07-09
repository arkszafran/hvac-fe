import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { UiBadgeComponent, UiButtonComponent, UiModalComponent } from '../../../ui';
import { Inspection } from '../models/inspection.model';
import {
  formatInspectionDate,
  getInspectionStatusLabel,
  getInspectionStatusVariant,
} from '../utils/inspection-ui.util';

@Component({
  selector: 'app-inspection-link-proposal-modal',
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
      @if (inspection(); as inspection) {
        <div class="space-y-4">
          <div class="rounded-[1rem] border border-border/80 bg-surface/62 p-4">
            <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
              {{ 'inspections.fields.customer' | transloco }}
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
                {{ 'inspections.linkProposal.devicesInInspection' | transloco: { count: inspection.deviceIds.length } }}
              </span>
            </div>

            <dl class="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <dt class="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                  {{ 'inspections.fields.inspectionDate' | transloco }}
                </dt>
                <dd class="mt-1 text-label text-text-main">
                  {{ inspection.inspectionDate ? formatInspectionDate(inspection.inspectionDate) : ('inspections.detail.unconfirmedDate' | transloco) }}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      }

      <div modal-footer class="grid gap-3 sm:grid-cols-2">
        <ui-button type="button" variant="ghost" [block]="true" (pressed)="close.emit()">
          {{ closeLabel() }}
        </ui-button>
        <ui-button type="button" variant="secondary" [block]="true" (pressed)="createSeparate.emit()">
          {{ secondaryLabel() }}
        </ui-button>
        <ui-button type="button" class="sm:col-span-2" [block]="true" (pressed)="confirm.emit()">
          {{ primaryLabel() }}
        </ui-button>
      </div>
    </ui-modal>
  `,
})
export class InspectionLinkProposalModalComponent {
  private readonly transloco = inject(TranslocoService);

  readonly open = input(false);
  readonly title = input('');
  readonly description = input('');
  readonly customerName = input('');
  readonly deviceName = input('');
  readonly inspection = input<Inspection | null>(null);
  readonly primaryActionLabel = input('');
  readonly secondaryActionLabel = input('');
  readonly cancelLabel = input('');

  readonly confirm = output<void>();
  readonly createSeparate = output<void>();
  readonly close = output<void>();

  protected readonly formatInspectionDate = formatInspectionDate;
  protected readonly getInspectionStatusVariant = getInspectionStatusVariant;

  protected modalTitle(): string {
    return this.title() || this.transloco.translate('inspections.linkProposal.defaultTitle');
  }

  protected primaryLabel(): string {
    return this.primaryActionLabel() || this.transloco.translate('inspections.linkProposal.primaryAction');
  }

  protected secondaryLabel(): string {
    return this.secondaryActionLabel() || this.transloco.translate('inspections.linkProposal.secondaryAction');
  }

  protected closeLabel(): string {
    return this.cancelLabel() || this.transloco.translate('common.actions.cancel');
  }

  protected getInspectionStatusLabel(status: Inspection['status']): string {
    return getInspectionStatusLabel(status, this.transloco);
  }
}
