import { ChangeDetectionStrategy, Component, booleanAttribute, input, output } from '@angular/core';

import { UiIconComponent } from '../icon/icon.component';

let nextFileInputId = 0;

@Component({
  selector: 'ui-file-input',
  imports: [UiIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './file-input.component.html',
  host: {
    class: 'block',
  },
})
export class UiFileInputComponent {
  readonly inputId = input(`ui-file-input-${++nextFileInputId}`);
  readonly buttonLabel = input('');
  readonly accept = input('');
  readonly multiple = input(false, { transform: booleanAttribute });

  readonly filesSelected = output<File[]>();

  protected handleSelection(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const files = Array.from(inputElement.files ?? []);

    if (files.length) {
      this.filesSelected.emit(files);
    }

    inputElement.value = '';
  }
}
