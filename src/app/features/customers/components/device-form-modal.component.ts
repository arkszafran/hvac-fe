import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
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
  protected readonly form = this.formBuilder.nonNullable.group({
    type: ['', Validators.required],
    brand: ['', Validators.required],
    model: ['', Validators.required],
    serialNumber: '',
    installationDate: '',
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
    };

    this.save.emit(draft);
  }

  protected validationError(field: 'type' | 'brand' | 'model'): string {
    const control = this.form.controls[field];

    if (!control.invalid || (!this.submitAttempted && !control.touched)) {
      return '';
    }

    if (control.hasError('required')) {
      if (field === 'type') {
        return 'Typ urządzenia jest wymagany.';
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

    this.form.reset(draft);
    this.submitAttempted = false;
  }
}
