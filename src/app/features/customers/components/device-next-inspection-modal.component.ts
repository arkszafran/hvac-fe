import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { UiButtonComponent, UiInputComponent, UiModalComponent } from '../../../ui';

@Component({
  selector: 'app-device-next-inspection-modal',
  standalone: true,
  imports: [ReactiveFormsModule, UiButtonComponent, UiInputComponent, UiModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-modal
      [open]="open()"
      title="Zmień datę następnego przeglądu"
      description="Ustaw nowy termin kolejnego przeglądu dla tego urządzenia."
      (close)="handleClose()"
    >
      <form class="ui-form-stack" [formGroup]="form">
        <ui-input
          label="Następny przegląd"
          type="date"
          formControlName="nextInspectionDate"
        />
      </form>

      <div modal-footer class="grid grid-cols-2 gap-3 sm:flex sm:justify-end">
        <ui-button type="button" variant="ghost" [block]="true" (pressed)="handleClose()">
          Anuluj
        </ui-button>
        <ui-button type="button" [block]="true" (pressed)="handleSubmit()">Zapisz datę</ui-button>
      </div>
    </ui-modal>
  `,
})
export class DeviceNextInspectionModalComponent {
  private readonly formBuilder = inject(FormBuilder);

  readonly open = input(false);
  readonly initialDate = input('');

  readonly close = output<void>();
  readonly save = output<string>();

  protected readonly form = this.formBuilder.nonNullable.group({
    nextInspectionDate: '',
  });

  constructor() {
    effect(() => {
      if (this.open()) {
        this.form.reset({
          nextInspectionDate: this.initialDate(),
        });
      }
    });
  }

  protected handleClose(): void {
    this.form.reset({
      nextInspectionDate: this.initialDate(),
    });
    this.close.emit();
  }

  protected handleSubmit(): void {
    this.save.emit(this.form.controls.nextInspectionDate.getRawValue());
  }
}
