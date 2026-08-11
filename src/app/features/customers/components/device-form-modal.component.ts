import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import {
  UiButtonComponent,
  UiInputComponent,
  UiModalComponent,
  UiSelectComponent,
} from '../../../ui';
import { DEVICE_BRAND_OPTIONS } from '../data/customer.mock';
import {
  calculateInspectionDateFromPreset,
  createDeviceInspectionPresetOptions,
  DEVICE_INSPECTIONS_CHECKBOX_DESCRIPTION_KEY,
  DEVICE_INSPECTIONS_CHECKBOX_LABEL_KEY,
  DeviceInspectionPreset,
  toInspectionDateTimeLocalValue,
} from '../models/device-inspection.model';
import {
  createDeviceTypeOptions,
  createEmptyDeviceDraft,
  createDeviceWarrantyMonthOptions,
  DeviceDraft,
  parseDevicePowerKw,
} from '../models/device.model';

const TEXTAREA_CLASSES =
  'ui-focus-ring block min-h-32 w-full rounded-[0.95rem] border border-border/90 bg-white px-4 py-3.5 text-[15px]/6 text-text-main shadow-[inset_0_1px_0_rgb(255_255_255/0.82),0_1px_2px_rgb(15_23_42/0.05)] backdrop-blur-xl transition duration-200 placeholder:text-text-muted/78 hover:border-primary/24 hover:bg-white focus:border-primary';

@Component({
  selector: 'app-device-form-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslocoPipe,
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
  private readonly transloco = inject(TranslocoService);
  private isApplyingInspectionPreset = false;

  readonly open = input(false);
  readonly initialValue = input<DeviceDraft | null>(null);
  readonly modalTitle = input('');
  readonly modalDescription = input('');
  readonly submitLabel = input('');

  readonly close = output<void>();
  readonly save = output<DeviceDraft>();

  protected submitAttempted = false;

  private readonly activeLanguage = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  protected readonly textareaClasses = TEXTAREA_CLASSES;
  protected readonly deviceBrandOptions = DEVICE_BRAND_OPTIONS;
  protected readonly inspectionCheckboxLabelKey = DEVICE_INSPECTIONS_CHECKBOX_LABEL_KEY;
  protected readonly inspectionCheckboxDescriptionKey = DEVICE_INSPECTIONS_CHECKBOX_DESCRIPTION_KEY;
  protected readonly deviceTypeOptions = computed(() => {
    this.activeLanguage();

    return createDeviceTypeOptions(this.transloco);
  });
  protected readonly deviceWarrantyMonthOptions = computed(() => {
    this.activeLanguage();

    return createDeviceWarrantyMonthOptions(this.transloco);
  });
  protected readonly inspectionPresetOptions = computed(() => {
    this.activeLanguage();

    return createDeviceInspectionPresetOptions(this.transloco);
  });
  protected readonly form = this.formBuilder.nonNullable.group({
    type: ['', Validators.required],
    brand: ['', Validators.required],
    model: ['', Validators.required],
    powerKw: ['', Validators.min(0)],
    serialNumber: '',
    installationDate: '',
    warrantyMonths: '0',
    hasScheduledInspections: false,
    nextInspectionPreset: 'custom' as DeviceInspectionPreset,
    nextInspectionDate: '',
    note: '',
    refrigerant: '',
    refrigerantAmount: '',
    location: '',
    hasCustomInstallationAddress: false,
    address: '',
    postalCode: '',
    city: '',
  });
  protected readonly hasCustomInstallationAddress = signal(
    this.form.controls.hasCustomInstallationAddress.value,
  );
  protected readonly warrantyMonths = signal(this.form.controls.warrantyMonths.value);
  protected readonly hasScheduledInspections = signal(
    this.form.controls.hasScheduledInspections.value,
  );
  protected readonly requiresInstallationDate = computed(() => Number(this.warrantyMonths()) > 0);

  constructor() {
    this.form.controls.hasCustomInstallationAddress.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((hasCustomAddress) => {
        this.hasCustomInstallationAddress.set(hasCustomAddress);

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
        this.warrantyMonths.set(warrantyMonths);
        this.syncInstallationDateValidator(warrantyMonths);
      });

    this.form.controls.hasScheduledInspections.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((hasScheduledInspections) => {
        this.hasScheduledInspections.set(hasScheduledInspections);
        this.syncNextInspectionDateValidator(hasScheduledInspections);
      });

    this.form.controls.nextInspectionPreset.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((preset) => {
        this.applyInspectionPreset(preset);
      });

    this.form.controls.nextInspectionDate.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.syncInspectionPresetWithDate();
    });

    this.syncInstallationDateValidator(this.form.controls.warrantyMonths.value);
    this.syncNextInspectionDateValidator(this.form.controls.hasScheduledInspections.value);

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

    const { nextInspectionPreset, ...rawValue } = this.form.getRawValue();
    const draft: DeviceDraft = {
      ...rawValue,
      type: this.form.controls.type.getRawValue() as DeviceDraft['type'],
      powerKw: parseDevicePowerKw(this.form.controls.powerKw.getRawValue()),
      warrantyMonths: Number(this.form.controls.warrantyMonths.getRawValue()),
      nextInspectionDate: this.form.controls.hasScheduledInspections.getRawValue()
        ? this.form.controls.nextInspectionDate.getRawValue().trim()
        : '',
    };

    this.save.emit(draft);
  }

  protected validationError(
    field: 'type' | 'brand' | 'model' | 'powerKw' | 'installationDate' | 'nextInspectionDate',
  ): string {
    const control = this.form.controls[field];

    if (!control.invalid || (!this.submitAttempted && !control.touched)) {
      return '';
    }

    if (control.hasError('required')) {
      if (field === 'type') {
        return this.transloco.translate('devices.validation.typeRequired');
      }

      if (field === 'installationDate') {
        return this.transloco.translate('devices.validation.installationDateRequired');
      }

      if (field === 'nextInspectionDate') {
        return this.transloco.translate('devices.validation.nextInspectionDateRequired');
      }

      return this.transloco.translate(
        field === 'brand' ? 'devices.validation.brandRequired' : 'devices.validation.modelRequired',
      );
    }

    if (field === 'powerKw' && control.hasError('min')) {
      return this.transloco.translate('devices.validation.powerNonNegative');
    }

    return '';
  }

  private resetForm(initialValue: DeviceDraft | null = null): void {
    const draft = initialValue
      ? {
          ...createEmptyDeviceDraft(),
          ...initialValue,
        }
      : createEmptyDeviceDraft();

    this.form.reset(
      {
        ...draft,
        powerKw: draft.powerKw?.toString() ?? '',
        warrantyMonths: draft.warrantyMonths.toString(),
        nextInspectionPreset: 'custom',
        nextInspectionDate: toInspectionDateTimeLocalValue(draft.nextInspectionDate),
      },
      { emitEvent: false },
    );
    this.hasCustomInstallationAddress.set(
      this.form.controls.hasCustomInstallationAddress.getRawValue(),
    );
    this.warrantyMonths.set(this.form.controls.warrantyMonths.getRawValue());
    this.hasScheduledInspections.set(this.form.controls.hasScheduledInspections.getRawValue());
    this.syncInstallationDateValidator(this.form.controls.warrantyMonths.getRawValue());
    this.syncNextInspectionDateValidator(this.form.controls.hasScheduledInspections.getRawValue());
    this.submitAttempted = false;
  }

  private syncInstallationDateValidator(warrantyMonths: string): void {
    this.form.controls.installationDate.setValidators(
      Number(warrantyMonths) > 0 ? Validators.required : null,
    );
    this.form.controls.installationDate.updateValueAndValidity({ emitEvent: false });
  }

  private syncNextInspectionDateValidator(hasScheduledInspections: boolean): void {
    this.form.controls.nextInspectionDate.setValidators(
      hasScheduledInspections ? Validators.required : null,
    );
    this.form.controls.nextInspectionDate.updateValueAndValidity({ emitEvent: false });
  }

  private applyInspectionPreset(preset: DeviceInspectionPreset): void {
    if (preset === 'custom' || !this.form.controls.hasScheduledInspections.getRawValue()) {
      return;
    }

    const calculatedDate = calculateInspectionDateFromPreset(preset);
    const currentTime =
      /T(\d{2}:\d{2})/.exec(this.form.controls.nextInspectionDate.getRawValue())?.[1] ?? '09:00';

    this.isApplyingInspectionPreset = true;
    this.form.controls.nextInspectionDate.setValue(`${calculatedDate}T${currentTime}`);
    this.isApplyingInspectionPreset = false;
  }

  private syncInspectionPresetWithDate(): void {
    if (this.isApplyingInspectionPreset) {
      return;
    }

    if (this.form.controls.nextInspectionPreset.getRawValue() === 'custom') {
      return;
    }

    this.form.controls.nextInspectionPreset.setValue('custom', { emitEvent: false });
  }
}
