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
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { startWith } from 'rxjs';

import { UiButtonComponent, UiInputComponent, UiModalComponent, UiSelectComponent } from '../../../ui';

export interface InspectionManualCustomerOption {
  id: string;
  label: string;
}

export interface InspectionManualDeviceOption {
  customerId: string;
  deviceId: string;
  label: string;
  description: string;
}

@Component({
  selector: 'app-inspection-create-modal',
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
      [title]="'inspections.createModal.title' | transloco"
      [description]="'inspections.createModal.description' | transloco"
      (close)="handleClose()"
    >
      <form class="space-y-5" [formGroup]="form">
        <ui-select
          [label]="'inspections.fields.customer' | transloco"
          required
          [placeholder]="'devices.customerPicker.title' | transloco"
          [options]="customerSelectOptions()"
          formControlName="customerId"
        />

        <ui-input
          [label]="'inspections.fields.inspectionDate' | transloco"
          type="date"
          required
          formControlName="inspectionDate"
        />

        <div class="space-y-3">
          <div>
            <p class="text-[13px]/5 font-semibold tracking-[-0.01em] text-text-main">
              {{ 'inspections.createModal.customerDevices' | transloco }}
            </p>
            <p class="mt-1 text-small text-text-muted">
              {{ 'inspections.createModal.customerDevicesDescription' | transloco }}
            </p>
          </div>

          @if (filteredDevices().length) {
            <div class="space-y-2">
              @for (device of filteredDevices(); track device.deviceId) {
                <label
                  class="flex cursor-pointer items-start gap-3 rounded-[1rem] border border-border/85 bg-white px-4 py-3 transition hover:border-primary/24 hover:bg-primary-soft/20"
                >
                  <input
                    type="checkbox"
                    class="mt-1 size-4 shrink-0 rounded border-border accent-[var(--color-primary)]"
                    [checked]="selectedDeviceIds().includes(device.deviceId)"
                    (change)="toggleDevice(device.deviceId)"
                  />

                  <span class="min-w-0">
                    <span class="block text-label text-text-main">{{ device.label }}</span>
                    <span class="block text-small text-text-muted">{{ device.description }}</span>
                  </span>
                </label>
              }
            </div>
          } @else {
            <div class="rounded-[1rem] border border-dashed border-border/90 bg-white/76 px-4 py-5 text-body text-text-muted">
              {{ 'inspections.createModal.emptyDevices' | transloco }}
            </div>
          }
        </div>
      </form>

      <div modal-footer class="grid gap-3 sm:grid-cols-2">
        <ui-button type="button" variant="ghost" [block]="true" (pressed)="handleClose()">
          {{ 'common.actions.cancel' | transloco }}
        </ui-button>
        <ui-button
          type="button"
          [block]="true"
          [disabled]="form.invalid || !selectedDeviceIds().length"
          (pressed)="handleSubmit()"
        >
          {{ 'inspections.actions.create' | transloco }}
        </ui-button>
      </div>
    </ui-modal>
  `,
})
export class InspectionCreateModalComponent {
  private readonly formBuilder = inject(FormBuilder);

  readonly open = input(false);
  readonly customers = input<InspectionManualCustomerOption[]>([]);
  readonly devices = input<InspectionManualDeviceOption[]>([]);
  readonly initialCustomerId = input('');
  readonly initialDeviceIds = input<string[]>([]);

  readonly close = output<void>();
  readonly save = output<{ customerId: string; deviceIds: string[]; inspectionDate: string }>();

  protected readonly selectedDeviceIds = signal<string[]>([]);
  protected readonly form = this.formBuilder.nonNullable.group({
    customerId: ['', Validators.required],
    inspectionDate: ['', Validators.required],
  });
  protected readonly selectedCustomerId = toSignal(
    this.form.controls.customerId.valueChanges.pipe(
      startWith(this.form.controls.customerId.getRawValue()),
    ),
    { initialValue: this.form.controls.customerId.getRawValue() },
  );

  protected readonly customerSelectOptions = computed(() =>
    this.customers().map((customer) => ({
      value: customer.id,
      label: customer.label,
    })),
  );
  protected readonly filteredDevices = computed(() =>
    this.devices().filter((device) => device.customerId === this.selectedCustomerId()),
  );

  constructor() {
    effect(() => {
      if (!this.open()) {
        return;
      }

      const defaultCustomerId = this.initialCustomerId() || this.customers()[0]?.id || '';

      this.form.reset({
        customerId: defaultCustomerId,
        inspectionDate: '',
      });
      this.selectedDeviceIds.set(this.initialDeviceIds());
    });

    effect(() => {
      const availableDeviceIds = new Set(this.filteredDevices().map((device) => device.deviceId));

      this.selectedDeviceIds.update((deviceIds) =>
        deviceIds.filter((deviceId) => availableDeviceIds.has(deviceId)),
      );
    });

    effect(() => {
      if (!this.open()) {
        return;
      }

      const customerIds = this.customers().map((customer) => customer.id);
      const currentCustomerId = this.form.controls.customerId.getRawValue();

      if (!customerIds.length && currentCustomerId) {
        this.form.controls.customerId.setValue('');
        return;
      }

      if (customerIds.length && !customerIds.includes(currentCustomerId)) {
        this.form.controls.customerId.setValue(customerIds[0]);
      }
    });
  }

  protected toggleDevice(deviceId: string): void {
    this.selectedDeviceIds.update((deviceIds) =>
      deviceIds.includes(deviceId)
        ? deviceIds.filter((currentId) => currentId !== deviceId)
        : [...deviceIds, deviceId],
    );
  }

  protected handleSubmit(): void {
    const customerId = this.form.controls.customerId.getRawValue();

    if (!customerId || !this.selectedDeviceIds().length) {
      return;
    }

    this.save.emit({
      customerId,
      deviceIds: this.selectedDeviceIds(),
      inspectionDate: this.form.controls.inspectionDate.getRawValue().trim(),
    });
  }

  protected handleClose(): void {
    this.close.emit();
  }
}
