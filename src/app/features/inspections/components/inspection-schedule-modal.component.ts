import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { UiButtonComponent, UiInputComponent, UiModalComponent } from '../../../ui';

@Component({
  selector: 'app-inspection-schedule-modal',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoPipe, UiButtonComponent, UiInputComponent, UiModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-modal
      [open]="open()"
      [title]="'inspections.scheduleModal.title' | transloco"
      [description]="'inspections.scheduleModal.description' | transloco"
      (close)="handleClose()"
    >
      <form [formGroup]="form">
        <ui-input
          [label]="'inspections.fields.inspectionDate' | transloco"
          type="date"
          required
          [error]="validationError()"
          formControlName="inspectionDate"
        />
      </form>

      <div modal-footer class="grid gap-3 sm:grid-cols-2">
        <ui-button type="button" variant="ghost" [block]="true" (pressed)="handleClose()">
          {{ 'common.actions.cancel' | transloco }}
        </ui-button>
        <ui-button type="button" [block]="true" (pressed)="handleSubmit()">
          {{ 'inspections.scheduleModal.save' | transloco }}
        </ui-button>
      </div>
    </ui-modal>
  `,
})
export class InspectionScheduleModalComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly transloco = inject(TranslocoService);

  readonly open = input(false);
  readonly initialDate = input('');

  readonly close = output<void>();
  readonly save = output<string>();

  protected submitAttempted = false;
  protected readonly form = this.formBuilder.nonNullable.group({
    inspectionDate: ['', Validators.required],
  });

  constructor() {
    effect(() => {
      if (!this.open()) {
        return;
      }

      this.form.reset({
        inspectionDate: this.initialDate(),
      });
      this.submitAttempted = false;
    });
  }

  protected handleSubmit(): void {
    this.submitAttempted = true;
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    this.save.emit(this.form.controls.inspectionDate.getRawValue().trim());
  }

  protected handleClose(): void {
    this.close.emit();
  }

  protected validationError(): string {
    const control = this.form.controls.inspectionDate;

    if (!control.invalid || (!this.submitAttempted && !control.touched)) {
      return '';
    }

    return this.transloco.translate('inspections.scheduleModal.validation');
  }
}
