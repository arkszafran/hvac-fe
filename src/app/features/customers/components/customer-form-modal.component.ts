import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { UiButtonComponent, UiInputComponent, UiModalComponent } from '../../../ui';
import { createEmptyCustomerDraft, CustomerDraft, CustomerType } from '../models/customer.model';

interface CustomerTypeOption {
  value: CustomerType;
  label: string;
  description: string;
}

@Component({
  selector: 'app-customer-form-modal',
  standalone: true,
  imports: [ReactiveFormsModule, UiButtonComponent, UiInputComponent, UiModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './customer-form-modal.component.html',
})
export class CustomerFormModalComponent {
  private readonly formBuilder = inject(FormBuilder);

  readonly open = input(false);

  readonly close = output<void>();
  readonly save = output<CustomerDraft>();

  protected submitAttempted = false;

  protected readonly customerTypeOptions: CustomerTypeOption[] = [
    {
      value: 'individual',
      label: 'Osoba prywatna',
      description: 'Klient indywidualny z adresem domowym lub prywatnym lokalem.',
    },
    {
      value: 'company',
      label: 'Firma',
      description: 'Klient biznesowy z nazwą firmy i osobą kontaktową.',
    },
  ];
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

  protected handleClose(): void {
    this.resetForm();
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
    this.resetForm();
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
          return 'Adres jest wymagany.';
        case 'postalCode':
          return 'Kod pocztowy jest wymagany.';
        case 'city':
          return 'Miasto jest wymagane.';
        case 'phone':
          return 'Telefon jest wymagany.';
        case 'email':
          return 'E-mail jest wymagany.';
      }
    }

    return '';
  }

  private resetForm(): void {
    this.form.reset(createEmptyCustomerDraft());
    this.submitAttempted = false;
  }
}
