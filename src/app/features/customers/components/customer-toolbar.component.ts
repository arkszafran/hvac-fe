import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';

import { UiInputComponent } from '../../../ui';

@Component({
  selector: 'app-customer-toolbar',
  imports: [ReactiveFormsModule, TranslocoPipe, UiInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './customer-toolbar.component.html',
})
export class CustomerToolbarComponent {
  readonly control = input<FormControl<string> | null>(null);
  readonly search = input('');
  readonly searchChange = output<string>();

  protected readonly fallbackControl = new FormControl('', { nonNullable: true });

  constructor() {
    effect(() => {
      if (this.control() || this.fallbackControl.value === this.search()) {
        return;
      }

      this.fallbackControl.setValue(this.search(), { emitEvent: false });
    });

    this.fallbackControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => this.searchChange.emit(value));
  }

  protected activeControl(): FormControl<string> {
    return this.control() ?? this.fallbackControl;
  }
}
