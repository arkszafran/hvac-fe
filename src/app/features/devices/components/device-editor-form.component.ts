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
import { merge, startWith } from 'rxjs';

import { UiInputComponent, UiSelectComponent } from '../../../ui';
import { DEVICE_BRAND_OPTIONS } from '../../customers/data/customer.mock';
import {
  calculateInspectionDateFromPreset,
  createDeviceInspectionPresetOptions,
  DEVICE_INSPECTIONS_CHECKBOX_DESCRIPTION_KEY,
  DEVICE_INSPECTIONS_CHECKBOX_LABEL_KEY,
  DeviceInspectionPreset,
} from '../../customers/models/device-inspection.model';
import {
  createDeviceTypeOptions,
  createEmptyDeviceDraft,
  createDeviceWarrantyMonthOptions,
  DeviceDraft,
  parseDevicePowerKw,
} from '../../customers/models/device.model';

const TEXTAREA_CLASSES =
  'ui-focus-ring block min-h-32 w-full resize-y rounded-field border border-transparent bg-surface-muted px-3.5 py-2.5 text-body text-text-main transition-colors duration-200 placeholder:text-text-muted hover:border-border focus:border-action focus:bg-surface motion-reduce:transition-none';

@Component({
  selector: 'app-device-editor-form',
  imports: [ReactiveFormsModule, TranslocoPipe, UiInputComponent, UiSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'deviceEditorForm',
  templateUrl: './device-editor-form.component.html',
})
export class DeviceEditorFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly transloco = inject(TranslocoService);
  private isApplyingInspectionPreset = false;

  readonly initialValue = input<DeviceDraft | null>(null);

  readonly validChange = output<boolean>();
  readonly draftChange = output<DeviceDraft | null>();

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
  protected readonly requiresInstallationDate = signal(false);

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
        this.requiresInstallationDate.set(Number(warrantyMonths) > 0);
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

    merge(this.form.valueChanges, this.form.statusChanges)
      .pipe(startWith(null), takeUntilDestroyed())
      .subscribe(() => {
        this.validChange.emit(this.form.valid);
        this.draftChange.emit(this.form.valid ? this.currentDraft() : null);
      });

    effect(() => {
      this.resetForm(this.initialValue());
    });

    this.syncInstallationDateValidator(this.form.controls.warrantyMonths.value);
    this.syncNextInspectionDateValidator(this.form.controls.hasScheduledInspections.value);
    this.requiresInstallationDate.set(Number(this.form.controls.warrantyMonths.value) > 0);
  }

  markAllAsTouched(): void {
    this.submitAttempted = true;
    this.form.markAllAsTouched();
  }

  currentDraft(): DeviceDraft {
    const { nextInspectionPreset, ...rawValue } = this.form.getRawValue();

    return {
      ...rawValue,
      type: this.form.controls.type.getRawValue() as DeviceDraft['type'],
      powerKw: parseDevicePowerKw(this.form.controls.powerKw.getRawValue()),
      warrantyMonths: Number(this.form.controls.warrantyMonths.getRawValue()),
      nextInspectionDate: this.form.controls.hasScheduledInspections.getRawValue()
        ? this.form.controls.nextInspectionDate.getRawValue().trim()
        : '',
    };
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
      },
      { emitEvent: false },
    );
    this.hasCustomInstallationAddress.set(
      this.form.controls.hasCustomInstallationAddress.getRawValue(),
    );
    this.warrantyMonths.set(this.form.controls.warrantyMonths.getRawValue());
    this.hasScheduledInspections.set(this.form.controls.hasScheduledInspections.getRawValue());
    this.requiresInstallationDate.set(Number(this.form.controls.warrantyMonths.getRawValue()) > 0);
    this.syncInstallationDateValidator(this.form.controls.warrantyMonths.getRawValue());
    this.syncNextInspectionDateValidator(this.form.controls.hasScheduledInspections.getRawValue());
    this.submitAttempted = false;
    this.validChange.emit(this.form.valid);
    this.draftChange.emit(this.form.valid ? this.currentDraft() : null);
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

    this.isApplyingInspectionPreset = true;
    this.form.controls.nextInspectionDate.setValue(calculatedDate);
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
