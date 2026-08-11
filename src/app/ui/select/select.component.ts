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
import { TranslocoService } from '@jsverse/transloco';

import { classNames } from '../utils/classnames';

export interface UiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

let nextSelectId = 0;

@Component({
  selector: 'ui-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiSelectComponent),
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
            <option value="" [disabled]="required()">{{ placeholderText() }}</option>
          }

          @for (option of options(); track option.value) {
            <option [value]="option.value" [disabled]="option.disabled">
              {{ option.label }}
            </option>
          }
        </select>

        @if (inlineLabel()) {
          <span
            class="pointer-events-none absolute inset-y-0 left-3.5 right-10 flex min-w-0 items-center gap-1 text-body"
            aria-hidden="true"
          >
            <span class="shrink-0 text-text-muted">{{ inlineLabel() }}:</span>
            <span class="truncate text-text-main">{{ selectedOptionLabel() }}</span>
          </span>
        }

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
  private readonly transloco = inject(TranslocoService);

  readonly inputId = input(`ui-select-${++nextSelectId}`);
  readonly label = input('');
  readonly inlineLabel = input('');
  readonly placeholder = input('');
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
      'ui-focus-ring block min-h-11 w-full appearance-none rounded-field border border-transparent bg-surface-muted px-3.5 py-2.5 pr-10 text-body text-text-main transition-colors duration-200 disabled:cursor-not-allowed disabled:text-text-muted',
      this.error()
        ? 'border-danger bg-danger-soft focus:border-danger focus-visible:ring-danger/20'
        : 'hover:border-border focus:border-action focus:bg-surface',
      this.inlineLabel() && 'text-transparent [&_option]:text-text-main',
    ),
  );

  protected selectedOptionLabel(): string {
    return (
      this.options().find((option) => option.value === this.value)?.label ?? this.placeholderText()
    );
  }

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

  protected placeholderText(): string {
    return this.placeholder() || this.transloco.translate('ui.select.placeholder');
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
