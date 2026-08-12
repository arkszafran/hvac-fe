import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { UiButtonComponent, UiFileInputComponent } from '../../../../ui';
import { ServiceOrderAttachment } from '../../models/service-order.model';

@Component({
  selector: 'app-service-order-attachment-picker',
  imports: [TranslocoPipe, UiButtonComponent, UiFileInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-order-attachment-picker.component.html',
})
export class ServiceOrderAttachmentPickerComponent {
  readonly label = input.required<string>();
  readonly hint = input('');
  readonly photos = input<ServiceOrderAttachment[]>([]);

  readonly filesAdded = output<File[]>();
  readonly photoRemoved = output<string>();
}
