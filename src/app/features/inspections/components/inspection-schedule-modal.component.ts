import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { UiButtonComponent, UiInputComponent, UiModalComponent } from '../../../ui';

@Component({
  selector: 'app-inspection-schedule-modal',
  standalone: true,
  imports: [ReactiveFormsModule, UiButtonComponent, UiInputComponent, UiModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-modal
      [open]="open()"
      title="Ustal termin przeglądu"
      description="Wpisz uzgodnioną z klientem datę wykonania przeglądu."
      (close)="handleClose()"
    >
      <form [formGroup]="form">
        <ui-input
          label="Planowany termin"
          type="date"
          required
          [error]="validationError()"
          formControlName="plannedDate"
        />
      </form>

      <div modal-footer class="grid gap-3 sm:grid-cols-2">
        <ui-button type="button" variant="ghost" [block]="true" (pressed)="handleClose()">
          Anuluj
        </ui-button>
        <ui-button type="button" [block]="true" (pressed)="handleSubmit()">
          Zapisz termin
        </ui-button>
      </div>
    </ui-modal>
  `,
})
export class InspectionScheduleModalComponent {
  private readonly formBuilder = inject(FormBuilder);

  readonly open = input(false);
  readonly initialDate = input('');

  readonly close = output<void>();
  readonly save = output<string>();

  protected submitAttempted = false;
  protected readonly form = this.formBuilder.nonNullable.group({
    plannedDate: ['', Validators.required],
  });

  constructor() {
    effect(() => {
      if (!this.open()) {
        return;
      }

      this.form.reset({
        plannedDate: this.initialDate(),
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

    this.save.emit(this.form.controls.plannedDate.getRawValue().trim());
  }

  protected handleClose(): void {
    this.close.emit();
  }

  protected validationError(): string {
    const control = this.form.controls.plannedDate;

    if (!control.invalid || (!this.submitAttempted && !control.touched)) {
      return '';
    }

    return 'Data planowanego przeglądu jest wymagana.';
  }
}
