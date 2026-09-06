import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { UiPhotoGalleryComponent } from '../../../../ui';
import type { ServiceOrderAttachment } from '../../models/service-order.model';

@Component({
  selector: 'app-service-order-photo-gallery',
  imports: [UiPhotoGalleryComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-order-photo-gallery.component.html',
})
export class ServiceOrderPhotoGalleryComponent {
  readonly photos = input<ServiceOrderAttachment[]>([]);
}
