import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';

import { UiInputComponent } from '../../../ui';

@Component({
  selector: 'app-device-toolbar',
  imports: [ReactiveFormsModule, TranslocoPipe, UiInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './device-toolbar.component.html',
})
export class DeviceToolbarComponent {
  readonly searchControl = input.required<FormControl<string>>();
}
