import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';

import { UiButtonComponent, UiInputComponent, UiModalComponent } from '../../../../ui';
import { toServiceOrderDateTimeLocalValue } from '../../utils/service-order-ui.util';

@Component({
  selector: 'app-service-order-schedule-modal',
  imports: [
    ReactiveFormsModule,
    TranslocoPipe,
    UiButtonComponent,
    UiInputComponent,
    UiModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-order-schedule-modal.component.html',
})
export class ServiceOrderScheduleModalComponent {
  readonly open = input(false);
  readonly scheduledAt = input('');
  readonly close = output<void>();
  readonly saved = output<string>();

  protected readonly scheduleControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  constructor() {
    effect(() => {
      if (!this.open()) {
        return;
      }

      this.scheduleControl.setValue(toServiceOrderDateTimeLocalValue(this.scheduledAt()));
      this.scheduleControl.markAsUntouched();
    });
  }

  protected saveSchedule(): void {
    if (this.scheduleControl.invalid) {
      this.scheduleControl.markAsTouched();
      return;
    }

    this.saved.emit(this.scheduleControl.getRawValue());
  }
}
