import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';

import { UiButtonComponent, UiInputComponent, UiModalComponent } from '../../../../ui';
import { toServiceOrderDateTimeLocalValue } from '../../utils/service-order-ui.util';

export interface ServiceOrderNextContactFormValue {
  nextContactAt: string;
  note: string;
}

const TEXTAREA_CLASSES =
  'ui-focus-ring mt-2 block min-h-28 w-full rounded-[0.95rem] border border-border/90 bg-white px-4 py-3.5 text-[15px]/6 text-text-main transition placeholder:text-text-muted/78 hover:border-primary/24 focus:border-primary';

@Component({
  selector: 'app-service-order-next-contact-modal',
  imports: [
    ReactiveFormsModule,
    TranslocoPipe,
    UiButtonComponent,
    UiInputComponent,
    UiModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-order-next-contact-modal.component.html',
})
export class ServiceOrderNextContactModalComponent {
  readonly open = input(false);
  readonly nextContactAt = input('');
  readonly close = output<void>();
  readonly saved = output<ServiceOrderNextContactFormValue>();

  protected readonly textareaClasses = TEXTAREA_CLASSES;
  protected readonly dateControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  protected readonly noteControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  constructor() {
    effect(() => {
      if (!this.open()) {
        return;
      }

      this.dateControl.setValue(toServiceOrderDateTimeLocalValue(this.nextContactAt()));
      this.dateControl.markAsUntouched();
      this.noteControl.reset('');
    });
  }

  protected saveContact(): void {
    if (this.dateControl.invalid || this.noteControl.invalid) {
      this.dateControl.markAsTouched();
      this.noteControl.markAsTouched();
      return;
    }

    this.saved.emit({
      nextContactAt: this.dateControl.getRawValue(),
      note: this.noteControl.getRawValue().trim(),
    });
  }
}
