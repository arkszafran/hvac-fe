import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';

import { UiButtonComponent, UiModalComponent } from '../../../../ui';

const TEXTAREA_CLASSES =
  'ui-focus-ring mt-2 block min-h-32 w-full rounded-[0.95rem] border border-border/90 bg-white px-4 py-3.5 text-[15px]/6 text-text-main transition placeholder:text-text-muted/78 hover:border-primary/24 focus:border-primary';

@Component({
  selector: 'app-service-order-note-modal',
  imports: [ReactiveFormsModule, TranslocoPipe, UiButtonComponent, UiModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-order-note-modal.component.html',
})
export class ServiceOrderNoteModalComponent {
  readonly open = input(false);
  readonly close = output<void>();
  readonly saved = output<string>();

  protected readonly textareaClasses = TEXTAREA_CLASSES;
  protected readonly noteControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  constructor() {
    effect(() => {
      if (!this.open()) {
        return;
      }

      this.noteControl.reset('');
    });
  }

  protected saveNote(): void {
    if (this.noteControl.invalid) {
      this.noteControl.markAsTouched();
      return;
    }

    this.saved.emit(this.noteControl.getRawValue().trim());
  }
}
