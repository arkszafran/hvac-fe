import { HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';

import { AttachmentsApi } from '../api/attachments/attachments.api';
import {
  PhotoAttachmentDto,
  ResolvedPhotoAttachmentDto,
} from '../api/attachments/attachments.model';
import { SKIP_ERROR_TOAST } from '../api/api-context.tokens';
import { ToastService } from '../../ui/toast/toast.service';

export type ResolvedPhotoGroup<T extends { photos: readonly PhotoAttachmentDto[] }> = Omit<
  T,
  'photos'
> & {
  photos: ResolvedPhotoAttachmentDto[];
};

interface CachedDownloadUrl {
  url: string;
  expiresAt: string;
}

@Injectable({ providedIn: 'root' })
export class AttachmentDownloadService {
  private readonly attachmentsApi = inject(AttachmentsApi);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);
  private readonly downloadUrlCache = new Map<string, CachedDownloadUrl>();

  resolvePhotoGroups<T extends { photos: readonly PhotoAttachmentDto[] }>(
    groups: readonly T[],
  ): Observable<ResolvedPhotoGroup<T>[]> {
    const photos = uniqueDownloadablePhotos(groups.flatMap((group) => group.photos));

    if (!photos.length) {
      return of(groups.map((group) => ({ ...group, photos: [] })));
    }

    return forkJoin(photos.map((photo) => this.resolvePhoto(photo))).pipe(
      map((resolvedPhotos) => {
        const failedCount = resolvedPhotos.filter((photo) => photo === null).length;

        if (failedCount > 0) {
          this.toast.error(this.transloco.translate('attachments.download.error'));
        }

        const photosById = new Map(
          resolvedPhotos
            .filter((photo): photo is ResolvedPhotoAttachmentDto => photo !== null)
            .map((photo) => [photo.id, photo]),
        );

        return groups.map((group) => ({
          ...group,
          photos: group.photos.flatMap((photo) => {
            const resolvedPhoto = photosById.get(photo.id);

            return resolvedPhoto ? [resolvedPhoto] : [];
          }),
        }));
      }),
    );
  }

  private resolvePhoto(photo: PhotoAttachmentDto): Observable<ResolvedPhotoAttachmentDto | null> {
    const cachedUrl = this.downloadUrlCache.get(photo.id);

    if (cachedUrl && isDownloadUrlValid(cachedUrl.expiresAt)) {
      return of({ ...photo, url: cachedUrl.url });
    }

    return this.attachmentsApi
      .getDownloadUrl(photo.id, {
        context: new HttpContext().set(SKIP_ERROR_TOAST, true),
      })
      .pipe(
        map(({ data }) => {
          this.downloadUrlCache.set(photo.id, data);

          return { ...photo, url: data.url };
        }),
        catchError(() => of(null)),
      );
  }
}

function uniqueDownloadablePhotos(photos: readonly PhotoAttachmentDto[]): PhotoAttachmentDto[] {
  return Array.from(
    new Map(photos.filter((photo) => photo.canDownload).map((photo) => [photo.id, photo])).values(),
  );
}

function isDownloadUrlValid(expiresAt: string): boolean {
  return Date.parse(expiresAt) - 30_000 > Date.now();
}
