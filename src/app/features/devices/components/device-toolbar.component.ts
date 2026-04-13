import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { UiInputComponent } from '../../../ui';

@Component({
  selector: 'app-device-toolbar',
  standalone: true,
  imports: [FormsModule, UiInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex w-full justify-start px-0.5 pt-1 pb-2">
      <div class="w-full max-w-[30rem] lg:max-w-[32rem]">
        <ui-input
          type="search"
          placeholder="Marka, model, klient lub adres instalacji"
          [ngModel]="search()"
          (ngModelChange)="searchChange.emit($event)"
        />
      </div>
    </div>
  `,
})
export class DeviceToolbarComponent {
  readonly search = input('');

  readonly searchChange = output<string>();
}
