import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { UiButtonComponent, UiInputComponent, UiModalComponent } from '../../../ui';
import { createEmptyCustomerDraft, CustomerDraft, CustomerType } from '../models/customer.model';

interface CustomerTypeOption {
  value: CustomerType;
  labelKey: string;
}

@Component({
  selector: 'app-customer-form-modal',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoPipe, UiButtonComponent, UiInputComponent, UiModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './customer-form-modal.component.html',
})
export class CustomerFormModalComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly transloco = inject(TranslocoService);

  readonly open = input(false);
  readonly initialValue = input<CustomerDraft | null>(null);
  readonly modalTitle = input('');
  readonly modalDescription = input('');
  readonly submitLabel = input('');

  readonly close = output<void>();
  readonly save = output<CustomerDraft>();

  protected submitAttempted = false;

  private readonly activeLanguage = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  private readonly customerTypeDefinitions: CustomerTypeOption[] = [
    {
      value: 'individual',
      labelKey: 'customers.types.individual.label',
    },
    {
      value: 'company',
      labelKey: 'customers.types.company.label',
    },
  ];
  protected readonly customerTypeOptions = computed(() => {
    this.activeLanguage();

    return this.customerTypeDefinitions.map((option) => ({
      value: option.value,
      label: this.transloco.translate(option.labelKey),
    }));
  });
  protected readonly form = this.formBuilder.nonNullable.group({
    type: 'individual' as CustomerType,
    companyName: '',
    fullName: '',
    phone: ['', Validators.required],
    email: ['', Validators.required],
    address: ['', Validators.required],
    postalCode: ['', Validators.required],
    city: ['', Validators.required],
  });

  constructor() {
    effect(() => {
      if (this.open()) {
        this.resetForm(this.initialValue());
      }
    });
  }

  protected handleClose(): void {
    this.resetForm(this.initialValue());
    this.close.emit();
  }

  protected handleSubmit(): void {
    this.submitAttempted = true;
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const draft = this.form.getRawValue();

    this.save.emit({
      ...draft,
      companyName: draft.type === 'company' ? draft.companyName : '',
    });
  }

  protected validationError(
    field: 'address' | 'postalCode' | 'city' | 'phone' | 'email',
  ): string {
    const control = this.form.controls[field];

    if (!control.invalid || (!this.submitAttempted && !control.touched)) {
      return '';
    }

    if (control.hasError('required')) {
      switch (field) {
        case 'address':
          return this.transloco.translate('customers.validation.addressRequired');
        case 'postalCode':
          return this.transloco.translate('customers.validation.postalCodeRequired');
        case 'city':
          return this.transloco.translate('customers.validation.cityRequired');
        case 'phone':
          return this.transloco.translate('customers.validation.phoneRequired');
        case 'email':
          return this.transloco.translate('customers.validation.emailRequired');
      }
    }

    return '';
  }

  private resetForm(initialValue: CustomerDraft | null = null): void {
    this.form.reset(initialValue ?? createEmptyCustomerDraft());
    this.submitAttempted = false;
  }
}
