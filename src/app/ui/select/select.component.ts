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

export interface UiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

let nextSelectId = 0;

@Component({
  selector: 'ui-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiSelectComponent),
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

      <div class="relative">
        <select
          [id]="inputId()"
          [name]="name() || null"
          [value]="value"
          [disabled]="isDisabled()"
          [required]="required()"
          [attr.aria-invalid]="error() ? 'true' : 'false'"
          [attr.aria-describedby]="describedBy() || null"
          [class]="selectClasses()"
          (change)="handleChange($event)"
          (blur)="handleBlur()"
        >
          @if (placeholder()) {
            <option value="" [disabled]="required()">{{ placeholder() }}</option>
          }

          @for (option of options(); track option.value) {
            <option [value]="option.value" [disabled]="option.disabled">
              {{ option.label }}
            </option>
          }
        </select>

        <span
          class="pointer-events-none absolute inset-y-0 right-4 flex items-center text-text-muted/90"
        >
          <svg viewBox="0 0 20 20" fill="none" class="size-4">
            <path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
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
export class UiSelectComponent implements ControlValueAccessor {
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  readonly inputId = input(`ui-select-${++nextSelectId}`);
  readonly label = input('');
  readonly placeholder = input('Wybierz opcję');
  readonly hint = input('');
  readonly error = input('');
  readonly name = input('');
  readonly required = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly options = input<UiSelectOption[]>([]);

  protected value = '';

  private disabledByForms = false;
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  protected readonly selectClasses = computed(() =>
    classNames(
      'ui-focus-ring block w-full appearance-none rounded-[0.95rem] border border-border/90 bg-white px-4 py-3.5 pr-11 text-[15px]/6 text-text-main shadow-[inset_0_1px_0_rgb(255_255_255/0.82),0_1px_2px_rgb(15_23_42/0.05)] backdrop-blur-xl transition duration-200 disabled:cursor-not-allowed disabled:border-transparent disabled:bg-surface-muted disabled:text-text-muted',
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

  protected handleChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.value = target.value;
    this.onChange(this.value);
  }

  protected handleBlur(): void {
    this.onTouched();
  }
}
