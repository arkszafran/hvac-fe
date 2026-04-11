import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  UiButtonComponent,
  UiInputComponent,
  UiModalComponent,
  UiSelectComponent,
} from '../../../ui';
import { DEVICE_BRAND_OPTIONS } from '../data/customer.mock';
import {
  createEmptyDeviceDraft,
  DeviceDraft,
  DEVICE_TYPE_OPTIONS,
  DEVICE_WARRANTY_MONTH_OPTIONS,
} from '../models/device.model';

const TEXTAREA_CLASSES =
  'ui-focus-ring block min-h-32 w-full rounded-[0.95rem] border border-border/90 bg-white px-4 py-3.5 text-[15px]/6 text-text-main shadow-[inset_0_1px_0_rgb(255_255_255/0.82),0_1px_2px_rgb(15_23_42/0.05)] backdrop-blur-xl transition duration-200 placeholder:text-text-muted/78 hover:border-primary/24 hover:bg-white focus:border-primary';

@Component({
  selector: 'app-device-form-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    UiButtonComponent,
    UiInputComponent,
    UiModalComponent,
    UiSelectComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './device-form-modal.component.html',
})
export class DeviceFormModalComponent {
  private readonly formBuilder = inject(FormBuilder);

  readonly open = input(false);
  readonly initialValue = input<DeviceDraft | null>(null);
  readonly modalTitle = input('Dodaj urządzenie');
  readonly modalDescription = input('');
  readonly submitLabel = input('Zapisz urządzenie');

  readonly close = output<void>();
  readonly save = output<DeviceDraft>();

  protected submitAttempted = false;

  protected readonly textareaClasses = TEXTAREA_CLASSES;
  protected readonly deviceBrandOptions = DEVICE_BRAND_OPTIONS;
  protected readonly deviceTypeOptions = DEVICE_TYPE_OPTIONS;
  protected readonly deviceWarrantyMonthOptions = DEVICE_WARRANTY_MONTH_OPTIONS;
  protected readonly form = this.formBuilder.nonNullable.group({
    type: ['', Validators.required],
    brand: ['', Validators.required],
    model: ['', Validators.required],
    serialNumber: '',
    installationDate: '',
    warrantyMonths: '0',
    nextInspectionDate: '',
    note: '',
    refrigerant: '',
    refrigerantAmount: '',
    location: '',
    hasCustomInstallationAddress: false,
    address: '',
    postalCode: '',
    city: '',
    serviceHistory: this.formBuilder.nonNullable.control(createEmptyDeviceDraft().serviceHistory),
  });
  protected readonly hasCustomInstallationAddress = toSignal(
    this.form.controls.hasCustomInstallationAddress.valueChanges,
    { initialValue: this.form.controls.hasCustomInstallationAddress.value },
  );
  protected readonly warrantyMonths = toSignal(this.form.controls.warrantyMonths.valueChanges, {
    initialValue: this.form.controls.warrantyMonths.value,
  });
  protected readonly requiresInstallationDate = computed(() => Number(this.warrantyMonths()) > 0);

  constructor() {
    this.form.controls.hasCustomInstallationAddress.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((hasCustomAddress) => {
        if (!hasCustomAddress) {
          this.form.patchValue({
            address: '',
            postalCode: '',
            city: '',
          });
        }
      });

    this.form.controls.warrantyMonths.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((warrantyMonths) => {
        this.syncInstallationDateValidator(warrantyMonths);
      });

    this.syncInstallationDateValidator(this.form.controls.warrantyMonths.value);

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

    const draft: DeviceDraft = {
      ...this.form.getRawValue(),
      type: this.form.controls.type.getRawValue() as DeviceDraft['type'],
      warrantyMonths: Number(this.form.controls.warrantyMonths.getRawValue()),
    };

    this.save.emit(draft);
  }

  protected validationError(field: 'type' | 'brand' | 'model' | 'installationDate'): string {
    const control = this.form.controls[field];

    if (!control.invalid || (!this.submitAttempted && !control.touched)) {
      return '';
    }

    if (control.hasError('required')) {
      if (field === 'type') {
        return 'Typ urządzenia jest wymagany.';
      }

      if (field === 'installationDate') {
        return 'Data uruchomienia jest wymagana, gdy wybrano gwarancję.';
      }

      return field === 'brand' ? 'Marka jest wymagana.' : 'Model jest wymagany.';
    }

    return '';
  }

  private resetForm(initialValue: DeviceDraft | null = null): void {
    const draft = initialValue
      ? {
          ...createEmptyDeviceDraft(),
          ...initialValue,
          serviceHistory: [...initialValue.serviceHistory],
        }
      : createEmptyDeviceDraft();

    this.form.reset({
      ...draft,
      warrantyMonths: draft.warrantyMonths.toString(),
    });
    this.syncInstallationDateValidator(this.form.controls.warrantyMonths.getRawValue());
    this.submitAttempted = false;
  }

  private syncInstallationDateValidator(warrantyMonths: string): void {
    this.form.controls.installationDate.setValidators(
      Number(warrantyMonths) > 0 ? Validators.required : null,
    );
    this.form.controls.installationDate.updateValueAndValidity({ emitEvent: false });
  }
}
