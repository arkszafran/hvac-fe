import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { UiIconComponent } from '../../../../ui';
import type { ServiceOrderAttachment } from '../../models/service-order.model';

@Component({
  selector: 'app-service-order-photo-gallery',
  imports: [TranslocoPipe, UiIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-order-photo-gallery.component.html',
})
export class ServiceOrderPhotoGalleryComponent {
  readonly photos = input<ServiceOrderAttachment[]>([]);
}
