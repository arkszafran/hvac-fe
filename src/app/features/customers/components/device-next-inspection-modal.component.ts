import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output } from '@angular/core';
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
} from '../models/device-inspection.model';
import { DeviceDraft } from '../models/device.model';

@Component({
  selector: 'app-device-next-inspection-modal',
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
  template: `
    <ui-modal
      [open]="open()"
      [title]="'devices.nextInspectionModal.title' | transloco"
      [description]="'devices.nextInspectionModal.description' | transloco"
      (close)="handleClose()"
    >
      <form class="ui-form-stack" [formGroup]="form">
        <div class="space-y-2.5">
          <label
            class="flex cursor-pointer items-start gap-3 rounded-[1.05rem] border border-border/90 bg-white px-4 py-3 transition hover:border-primary/28 hover:bg-primary-soft/24"
          >
            <input
              type="checkbox"
              formControlName="hasScheduledInspections"
              class="mt-1 size-4 shrink-0 rounded border-border accent-[var(--color-primary)]"
            />

            <span class="min-w-0">
              <span class="block text-label text-text-main">{{ inspectionCheckboxLabelKey | transloco }}</span>
              <span class="block text-small text-text-muted">
                {{ inspectionCheckboxDescriptionKey | transloco }}
              </span>
            </span>
          </label>
        </div>

        @if (form.controls.hasScheduledInspections.value) {
          <div class="grid gap-4 sm:grid-cols-2">
            <ui-select
              [label]="'devices.form.nextInspectionPreset' | transloco"
              [options]="inspectionPresetOptions()"
              formControlName="nextInspectionPreset"
            />

            <ui-input
              [label]="'devices.form.nextInspectionDate' | transloco"
              type="date"
              required
              [error]="validationError()"
              formControlName="nextInspectionDate"
            />
          </div>
        }
      </form>

      <div modal-footer class="grid grid-cols-2 gap-3 sm:flex sm:justify-end">
        <ui-button type="button" variant="ghost" [block]="true" (pressed)="handleClose()">
          {{ 'common.actions.cancel' | transloco }}
        </ui-button>
        <ui-button type="button" [block]="true" (pressed)="handleSubmit()">
          {{ 'common.actions.saveChanges' | transloco }}
        </ui-button>
      </div>
    </ui-modal>
  `,
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

    this.form.controls.nextInspectionDate.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
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
    this.form.reset({
        hasScheduledInspections: this.initialEnabled(),
        nextInspectionPreset: 'custom',
        nextInspectionDate: this.initialDate(),
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
