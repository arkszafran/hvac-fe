import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
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
import {
  calculateInspectionDateFromPreset,
  createDeviceInspectionPresetOptions,
  DEVICE_INSPECTIONS_CHECKBOX_DESCRIPTION_KEY,
  DEVICE_INSPECTIONS_CHECKBOX_LABEL_KEY,
  DeviceInspectionPreset,
  toInspectionDateTimeLocalValue,
} from '../models/device-inspection.model';
import { DeviceDraft } from '../models/device.model';

@Component({
  selector: 'app-device-next-inspection-modal',
  imports: [
    ReactiveFormsModule,
    TranslocoPipe,
    UiButtonComponent,
    UiInputComponent,
    UiModalComponent,
    UiSelectComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './device-next-inspection-modal.component.html',
})
export class DeviceNextInspectionModalComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly transloco = inject(TranslocoService);
  private isApplyingInspectionPreset = false;

  readonly open = input(false);
  readonly initialEnabled = input(false);
  readonly initialDate = input('');

  readonly close = output<void>();
  readonly save = output<Pick<DeviceDraft, 'hasScheduledInspections' | 'nextInspectionDate'>>();

  protected submitAttempted = false;
  private readonly activeLanguage = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  protected readonly inspectionCheckboxLabelKey = DEVICE_INSPECTIONS_CHECKBOX_LABEL_KEY;
  protected readonly inspectionCheckboxDescriptionKey = DEVICE_INSPECTIONS_CHECKBOX_DESCRIPTION_KEY;
  protected readonly inspectionPresetOptions = computed(() => {
    this.activeLanguage();

    return createDeviceInspectionPresetOptions(this.transloco);
  });
  protected readonly form = this.formBuilder.nonNullable.group({
    hasScheduledInspections: false,
    nextInspectionPreset: 'custom' as DeviceInspectionPreset,
    nextInspectionDate: '',
  });

  constructor() {
    this.form.controls.hasScheduledInspections.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((hasScheduledInspections) => {
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

    this.syncNextInspectionDateValidator(this.form.controls.hasScheduledInspections.value);

    effect(() => {
      if (this.open()) {
        this.resetForm();
      }
    });
  }

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

    const hasScheduledInspections = this.form.controls.hasScheduledInspections.getRawValue();

    this.save.emit({
      hasScheduledInspections,
      nextInspectionDate: hasScheduledInspections
        ? this.form.controls.nextInspectionDate.getRawValue().trim()
        : '',
    });
  }

  protected validationError(): string {
    const control = this.form.controls.nextInspectionDate;

    if (!control.invalid || (!this.submitAttempted && !control.touched)) {
      return '';
    }

    return control.hasError('required')
      ? this.transloco.translate('devices.validation.nextInspectionDateRequired')
      : '';
  }

  private resetForm(): void {
    this.form.reset(
      {
        hasScheduledInspections: this.initialEnabled(),
        nextInspectionPreset: 'custom',
        nextInspectionDate: toInspectionDateTimeLocalValue(this.initialDate()),
      },
      { emitEvent: false },
    );
    this.syncNextInspectionDateValidator(this.form.controls.hasScheduledInspections.getRawValue());
    this.submitAttempted = false;
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
