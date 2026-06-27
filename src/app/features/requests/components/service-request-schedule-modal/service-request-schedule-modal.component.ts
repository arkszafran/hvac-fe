import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { UiButtonComponent, UiInputComponent, UiModalComponent } from '../../../../ui';

@Component({
  selector: 'app-service-request-schedule-modal',
  imports: [ReactiveFormsModule, UiButtonComponent, UiInputComponent, UiModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-request-schedule-modal.component.html',
})
export class ServiceRequestScheduleModalComponent {
  private readonly formBuilder = inject(FormBuilder);

  readonly open = input(false);
  readonly initialDate = input('');

  readonly close = output<void>();
  readonly save = output<string>();

  protected submitAttempted = false;
  protected readonly form = this.formBuilder.nonNullable.group({
    appointmentDate: ['', Validators.required],
  });

  constructor() {
    effect(() => {
      if (!this.open()) {
        return;
      }

      this.form.reset({
        appointmentDate: this.initialDate(),
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

    this.save.emit(this.form.controls.appointmentDate.getRawValue().trim());
  }

  protected handleClose(): void {
    this.close.emit();
  }

  protected validationError(): string {
    const control = this.form.controls.appointmentDate;

    if (!control.invalid || (!this.submitAttempted && !control.touched)) {
      return '';
    }

    return 'Data spotkania jest wymagana.';
  }
}
