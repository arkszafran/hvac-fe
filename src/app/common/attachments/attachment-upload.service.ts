import { Injectable, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

import { AttachmentUploadFormDto } from '../api';
import { AppLoaderService } from '../loader/app-loader.service';
import { ToastService } from '../../ui/toast/toast.service';

export interface AttachmentUploadTask {
  clientFileId: string;
  file: File;
  upload: AttachmentUploadFormDto;
}

export interface AttachmentUploadResult {
  clientFileId: string;
  fileName: string;
  isUploaded: boolean;
}

@Injectable({ providedIn: 'root' })
export class AttachmentUploadService {
  private readonly loader = inject(AppLoaderService);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  uploadFiles(tasks: readonly AttachmentUploadTask[]): Promise<AttachmentUploadResult[]> {
    if (!tasks.length) {
      return Promise.resolve([]);
    }

    return this.loader.trackPromise(Promise.all(tasks.map((task) => this.uploadFile(task))));
  }

  private async uploadFile(task: AttachmentUploadTask): Promise<AttachmentUploadResult> {
    try {
      const formData = new FormData();

      for (const [key, value] of Object.entries(task.upload.fields)) {
        formData.append(key, value);
      }

      formData.append('file', task.file);

      const response = await fetch(task.upload.url, {
        method: task.upload.method,
        body: formData,
        credentials: 'omit',
      });

      if (!response.ok) {
        throw new Error(`Storage upload failed with status ${response.status}.`);
      }

      return {
        clientFileId: task.clientFileId,
        fileName: task.file.name,
        isUploaded: true,
      };
    } catch {
      this.toast.error(
        this.transloco.translate('attachments.upload.error', { fileName: task.file.name }),
      );

      return {
        clientFileId: task.clientFileId,
        fileName: task.file.name,
        isUploaded: false,
      };
    }
  }
}
