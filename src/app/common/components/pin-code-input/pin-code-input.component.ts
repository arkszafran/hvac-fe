import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  output,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { UiButtonComponent } from '../../../ui';

const KEYPAD_DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0] as const;

@Component({
  selector: 'app-pin-code-input',
  imports: [TranslocoPipe, UiButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pin-code-input.component.html',
})
export class PinCodeInputComponent {
  readonly value = input('');
  readonly length = input(4);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input('');

  readonly pinChange = output<string>();
  readonly pinComplete = output<string>();

  protected readonly keypadDigits = KEYPAD_DIGITS;
  protected readonly normalizedValue = computed(() =>
    this.value().replace(/\D/g, '').slice(0, this.length()),
  );
  protected readonly pinSlots = computed(() =>
    Array.from({ length: this.length() }, (_, index) => index < this.normalizedValue().length),
  );
  protected readonly isDeleteDisabled = computed(
    () => this.disabled() || this.normalizedValue().length === 0,
  );

  protected appendDigit(digit: number): void {
    if (this.disabled() || this.normalizedValue().length >= this.length()) {
      return;
    }

    const nextValue = `${this.normalizedValue()}${digit}`;
    this.pinChange.emit(nextValue);

    if (nextValue.length === this.length()) {
      this.pinComplete.emit(nextValue);
    }
  }

  protected removeLastDigit(): void {
    if (this.isDeleteDisabled()) {
      return;
    }

    this.pinChange.emit(this.normalizedValue().slice(0, -1));
  }
}
