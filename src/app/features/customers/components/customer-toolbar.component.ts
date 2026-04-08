import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { UiInputComponent } from '../../../ui';

@Component({
  selector: 'app-customer-toolbar',
  standalone: true,
  imports: [FormsModule, UiInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex w-full justify-start">
      <div class="w-full max-w-[28rem] lg:max-w-[30rem]">
        <ui-input
          type="search"
          placeholder="Szukaj klienta"
          [ngModel]="search()"
          (ngModelChange)="searchChange.emit($event)"
        />
      </div>
    </div>
  `,
})
export class CustomerToolbarComponent {
  readonly search = input('');

  readonly searchChange = output<string>();
}
