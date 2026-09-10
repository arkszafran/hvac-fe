export interface PhotoAttachment {
  id: string;
  fileName: string;
  url: string;
  description?: string;
}

export interface LocalPhotoAttachment extends PhotoAttachment {
  file: File;
}

export function createPhotoAttachments(
  files: readonly File[],
  idPrefix = 'photo',
): LocalPhotoAttachment[] {
  return files
    .filter((file) => file.type.startsWith('image/'))
    .map((file) => ({
      id: createPhotoId(idPrefix),
      fileName: file.name,
      url: URL.createObjectURL(file),
      file,
    }));
}

export function removePhotoAttachment<T extends PhotoAttachment>(
  photos: readonly T[],
  photoId: string,
): T[] {
  const photo = photos.find((item) => item.id === photoId);

  if (photo) {
    revokePhotoAttachment(photo);
  }

  return photos.filter((item) => item.id !== photoId);
}

export function revokePhotoAttachments(photos: readonly PhotoAttachment[]): void {
  for (const photo of photos) {
    revokePhotoAttachment(photo);
  }
}

function revokePhotoAttachment(photo: PhotoAttachment): void {
  if (photo.url.startsWith('blob:')) {
    URL.revokeObjectURL(photo.url);
  }
}

function createPhotoId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
