import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';

import {
  createPhotoAttachments,
  PhotoAttachment,
  removePhotoAttachment,
  revokePhotoAttachments,
} from '../../../../common/models/photo-attachment.model';
import { UiButtonComponent, UiModalComponent, UiPhotoCaptureComponent } from '../../../../ui';

export interface ServiceOrderNoteFormValue {
  content: string;
  photos: PhotoAttachment[];
}

const TEXTAREA_CLASSES =
  'ui-focus-ring mt-2 block min-h-32 w-full rounded-[0.95rem] border border-border/90 bg-white px-4 py-3.5 text-[15px]/6 text-text-main transition placeholder:text-text-muted/78 hover:border-primary/24 focus:border-primary';

@Component({
  selector: 'app-service-order-note-modal',
  imports: [
    ReactiveFormsModule,
    TranslocoPipe,
    UiButtonComponent,
    UiModalComponent,
    UiPhotoCaptureComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-order-note-modal.component.html',
})
export class ServiceOrderNoteModalComponent {
  private readonly destroyRef = inject(DestroyRef);

  readonly open = input(false);
  readonly close = output<void>();
  readonly saved = output<ServiceOrderNoteFormValue>();

  protected readonly textareaClasses = TEXTAREA_CLASSES;
  protected readonly noteControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  protected readonly photos = signal<PhotoAttachment[]>([]);

  constructor() {
    effect(() => {
      if (!this.open()) {
        return;
      }

      untracked(() => this.resetDraft());
    });

    this.destroyRef.onDestroy(() => revokePhotoAttachments(this.photos()));
  }

  protected addPhotos(files: File[]): void {
    this.photos.update((photos) => [
      ...photos,
      ...createPhotoAttachments(files, 'order-note-photo'),
    ]);
  }

  protected removePhoto(photoId: string): void {
    this.photos.update((photos) => removePhotoAttachment(photos, photoId));
  }

  protected cancel(): void {
    this.resetDraft();
    this.close.emit();
  }

  protected saveNote(): void {
    if (this.noteControl.invalid) {
      this.noteControl.markAsTouched();
      return;
    }

    const value: ServiceOrderNoteFormValue = {
      content: this.noteControl.getRawValue().trim(),
      photos: [...this.photos()],
    };

    this.photos.set([]);
    this.saved.emit(value);
  }

  private resetDraft(): void {
    revokePhotoAttachments(this.photos());
    this.photos.set([]);
    this.noteControl.reset('');
  }
}
