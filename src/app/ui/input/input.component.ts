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

type UiInputIcon = 'none' | 'search' | 'calendar';

let nextInputId = 0;

@Component({
  selector: 'ui-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiInputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="space-y-1.5">
      @if (label()) {
        <label [attr.for]="inputId()" class="flex items-center gap-1 text-label text-text-muted">
          <span>{{ label() }}</span>
          @if (required()) {
            <span class="text-danger">*</span>
          }
        </label>
      }

      <div class="relative">
        @if (leadingIcon() !== 'none') {
          <span
            class="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-text-muted"
            aria-hidden="true"
          >
            @if (leadingIcon() === 'search') {
              <svg viewBox="0 0 20 20" fill="none" class="size-4">
                <circle cx="8.75" cy="8.75" r="5.25" stroke="currentColor" stroke-width="1.5" />
                <path
                  d="M12.6 12.6L16.2 16.2"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
            }
          </span>
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
          [attr.min]="min()"
          [attr.step]="step()"
          [autocomplete]="autocomplete()"
          [attr.aria-invalid]="error() ? 'true' : 'false'"
          [attr.aria-describedby]="describedBy() || null"
          [class]="inputClasses()"
          (input)="handleInput($event)"
          (blur)="handleBlur()"
        />

        @if (trailingIcon() === 'calendar') {
          <span
            class="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-text-main"
            aria-hidden="true"
          >
            <svg viewBox="0 0 20 20" fill="none" class="size-4">
              <path
                d="M5 3.5V6M15 3.5V6M3.5 8H16.5"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
              <rect
                x="3.5"
                y="5"
                width="13"
                height="12"
                rx="1.75"
                stroke="currentColor"
                stroke-width="1.5"
              />
            </svg>
          </span>
        }
      </div>

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
  readonly leadingIcon = input<UiInputIcon>('none');
  readonly trailingIcon = input<UiInputIcon>('none');
  readonly name = input('');
  readonly autocomplete = input('off');
  readonly min = input<string | number | null>(null);
  readonly step = input<string | number | null>(null);
  readonly required = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });

  protected value = '';

  private disabledByForms = false;
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  protected readonly inputClasses = computed(() =>
    classNames(
      'ui-focus-ring block min-h-11 w-full rounded-field border border-transparent bg-surface-muted px-3.5 py-2.5 text-body text-text-main transition-colors duration-200 placeholder:text-text-muted disabled:cursor-not-allowed disabled:text-text-muted',
      this.error()
        ? 'border-danger bg-danger-soft focus:border-danger focus-visible:ring-danger/20'
        : 'hover:border-border focus:border-action focus:bg-surface',
      this.leadingIcon() !== 'none' && 'pl-10',
      this.trailingIcon() !== 'none' && 'pr-10',
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
