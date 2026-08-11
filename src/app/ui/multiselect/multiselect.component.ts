import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { classNames } from '../utils/classnames';

export interface UiMultiselectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

let nextMultiselectId = 0;

@Component({
  selector: 'ui-multiselect',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiMultiselectComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './multiselect.component.html',
  host: {
    class: 'block',
  },
})
export class UiMultiselectComponent implements ControlValueAccessor {
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly triggerButton = viewChild<ElementRef<HTMLButtonElement>>('triggerButton');

  readonly inputId = input(`ui-multiselect-${++nextMultiselectId}`);
  readonly label = input('');
  readonly inlineLabel = input('');
  readonly placeholder = input('');
  readonly allSelectedLabel = input('');
  readonly selectionLabel = input('');
  readonly hint = input('');
  readonly error = input('');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly options = input<UiMultiselectOption[]>([]);

  protected readonly isOpen = signal(false);
  protected readonly selectedValues = signal<string[]>([]);
  protected readonly panelId = computed(() => `${this.inputId()}-panel`);
  protected readonly selectionText = computed(() => {
    const options = this.options();
    const selectedValues = this.selectedValues();
    const selectedOptions = options.filter((option) => selectedValues.includes(option.value));

    if (!selectedOptions.length) {
      return this.placeholder();
    }

    if (this.selectionLabel()) {
      return this.selectionLabel();
    }

    if (
      this.allSelectedLabel() &&
      options.length > 0 &&
      options.every((option) => selectedValues.includes(option.value))
    ) {
      return this.allSelectedLabel();
    }

    return selectedOptions.map((option) => option.label).join(', ');
  });
  protected readonly describedBy = computed(() =>
    [
      this.error() ? `${this.inputId()}-error` : '',
      !this.error() && this.hint() ? `${this.inputId()}-hint` : '',
    ]
      .filter(Boolean)
      .join(' '),
  );
  protected readonly triggerClasses = computed(() =>
    classNames(
      'ui-focus-ring flex min-h-11 w-full items-center justify-between gap-3 rounded-field border bg-surface-muted px-3.5 py-2.5 text-left text-body text-text-main transition-colors duration-200 motion-reduce:transition-none disabled:cursor-not-allowed disabled:text-text-muted',
      this.error()
        ? 'border-danger bg-danger-soft hover:border-danger focus:border-danger focus-visible:ring-danger/20'
        : 'border-transparent hover:border-border focus:border-action focus:bg-surface',
      this.isOpen() && !this.error() && 'border-action bg-surface',
    ),
  );

  private disabledByForms = false;
  private onChange: (value: string[]) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    const handleDocumentClick = (event: MouseEvent): void => {
      if (!this.isOpen() || this.containsTarget(event.target)) {
        return;
      }

      this.close();
    };
    const handleDocumentKeydown = (event: KeyboardEvent): void => {
      if (!this.isOpen() || event.key !== 'Escape') {
        return;
      }

      event.preventDefault();
      this.close();
      this.triggerButton()?.nativeElement.focus();
    };

    this.document.addEventListener('click', handleDocumentClick);
    this.document.addEventListener('keydown', handleDocumentKeydown);
    this.destroyRef.onDestroy(() => {
      this.document.removeEventListener('click', handleDocumentClick);
      this.document.removeEventListener('keydown', handleDocumentKeydown);
    });
  }

  writeValue(value: string[] | null): void {
    this.selectedValues.set([...new Set(value ?? [])]);
    this.changeDetectorRef.markForCheck();
  }

  registerOnChange(fn: (value: string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledByForms = isDisabled;

    if (isDisabled) {
      this.close();
    }

    this.changeDetectorRef.markForCheck();
  }

  protected isDisabled(): boolean {
    return this.disabled() || this.disabledByForms;
  }

  protected toggleDropdown(): void {
    if (this.isDisabled()) {
      return;
    }

    this.isOpen.update((isOpen) => !isOpen);
    this.onTouched();
  }

  protected isSelected(value: string): boolean {
    return this.selectedValues().includes(value);
  }

  protected toggleOption(value: string): void {
    const nextValues = this.isSelected(value)
      ? this.selectedValues().filter((selectedValue) => selectedValue !== value)
      : [...this.selectedValues(), value];

    this.selectedValues.set(nextValues);
    this.onChange(nextValues);
    this.onTouched();
  }

  private close(): void {
    this.isOpen.set(false);
  }

  private containsTarget(target: EventTarget | null): boolean {
    return target instanceof Node && this.host.nativeElement.contains(target);
  }
}
