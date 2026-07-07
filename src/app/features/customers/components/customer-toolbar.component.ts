import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';

import { UiInputComponent } from '../../../ui';

@Component({
  selector: 'app-customer-toolbar',
  standalone: true,
  imports: [FormsModule, TranslocoPipe, UiInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex w-full justify-start px-0.5 pt-1 pb-2">
      <div class="w-full max-w-[30rem] lg:max-w-[32rem]">
        <ui-input
          type="search"
          [placeholder]="'customers.searchPlaceholder' | transloco"
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
