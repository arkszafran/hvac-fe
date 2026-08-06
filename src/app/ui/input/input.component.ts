import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { classNames } from '../utils/classnames';

type UiInputType =
  | 'text'
  | 'email'
  | 'tel'
  | 'number'
  | 'password'
  | 'search'
  | 'date'
  | 'time'
  | 'datetime-local';

let nextInputId = 0;

@Component({
  selector: 'ui-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiInputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="space-y-2.5">
      @if (label()) {
        <label
          [attr.for]="inputId()"
          class="flex items-center gap-1 text-[13px]/5 font-semibold tracking-[-0.01em] text-text-main"
        >
          <span>{{ label() }}</span>
          @if (required()) {
            <span class="text-danger">*</span>
          }
        </label>
      }

      <input
        [id]="inputId()"
        [type]="type()"
        [name]="name() || null"
        [placeholder]="placeholder()"
        [value]="value"
        [disabled]="isDisabled()"
        [readOnly]="readonly()"
        [required]="required()"
        [autocomplete]="autocomplete()"
        [attr.aria-invalid]="error() ? 'true' : 'false'"
        [attr.aria-describedby]="describedBy() || null"
        [class]="inputClasses()"
        (input)="handleInput($event)"
        (blur)="handleBlur()"
      />

      @if (error()) {
        <p [id]="inputId() + '-error'" class="text-[13px]/5 font-medium text-danger">
          {{ error() }}
        </p>
      } @else if (hint()) {
        <p [id]="inputId() + '-hint'" class="text-[13px]/5 text-text-muted">
          {{ hint() }}
        </p>
      }
    </div>
  `,
})
export class UiInputComponent implements ControlValueAccessor {
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  readonly inputId = input(`ui-input-${++nextInputId}`);
  readonly label = input('');
  readonly placeholder = input('');
  readonly hint = input('');
  readonly error = input('');
  readonly type = input<UiInputType>('text');
  readonly name = input('');
  readonly autocomplete = input('off');
  readonly required = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });

  protected value = '';

  private disabledByForms = false;
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  protected readonly inputClasses = computed(() =>
    classNames(
      'ui-focus-ring block w-full rounded-[0.95rem] border border-border/90 bg-white px-4 py-3.5 text-[15px]/6 text-text-main shadow-[inset_0_1px_0_rgb(255_255_255/0.82),0_1px_2px_rgb(15_23_42/0.05)] backdrop-blur-xl transition duration-200 placeholder:text-text-muted/78 disabled:cursor-not-allowed disabled:border-transparent disabled:bg-surface-muted disabled:text-text-muted',
      this.error()
        ? 'border-danger/55 hover:border-danger/70 focus:border-danger focus-visible:ring-danger/12'
        : 'hover:border-primary/24 hover:bg-white focus:border-primary',
    ),
  );

  protected readonly describedBy = computed(() =>
    [
      this.error() ? `${this.inputId()}-error` : '',
      !this.error() && this.hint() ? `${this.inputId()}-hint` : '',
    ]
      .filter(Boolean)
      .join(' '),
  );

  protected isDisabled(): boolean {
    return this.disabled() || this.disabledByForms;
  }

  writeValue(value: string | null): void {
    this.value = value ?? '';
    this.changeDetectorRef.markForCheck();
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledByForms = isDisabled;
    this.changeDetectorRef.markForCheck();
  }

  protected handleInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
  }

  protected handleBlur(): void {
    this.onTouched();
  }
}
