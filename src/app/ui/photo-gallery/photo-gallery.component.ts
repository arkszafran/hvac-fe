import { ChangeDetectionStrategy, Component, booleanAttribute, input, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { UiButtonComponent } from '../button/button.component';
import { UiModalComponent } from '../modal/modal.component';
import type { UiPhotoCaptureItem } from '../photo-capture/photo-capture.component';

@Component({
  selector: 'ui-photo-gallery',
  imports: [TranslocoPipe, UiButtonComponent, UiModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './photo-gallery.component.html',
})
export class UiPhotoGalleryComponent {
  readonly photos = input<readonly UiPhotoCaptureItem[]>([]);
  readonly compact = input(false, { transform: booleanAttribute });

  protected readonly selectedPhoto = signal<UiPhotoCaptureItem | null>(null);
}
