import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClientService, ApiRequestOptions } from '../api-client.service';
import {
  AttachmentDownloadResponseDto,
  AttachmentsListResponseDto,
  PrepareAttachmentUploadsDto,
  PrepareAttachmentUploadsResponseDto,
} from './attachments.model';

@Injectable({ providedIn: 'root' })
export class AttachmentsApi {
  private readonly api = inject(ApiClientService);

  prepareUploads(
    body: PrepareAttachmentUploadsDto,
    options?: ApiRequestOptions,
  ): Observable<PrepareAttachmentUploadsResponseDto> {
    return this.api.post<PrepareAttachmentUploadsResponseDto, PrepareAttachmentUploadsDto>(
      '/attachments/upload-requests',
      body,
      options,
    );
  }

  listAttachments(
    attachmentIds: readonly string[],
    options?: ApiRequestOptions,
  ): Observable<AttachmentsListResponseDto> {
    return this.api.get<AttachmentsListResponseDto>('/attachments', {
      ...options,
      params: { ids: attachmentIds.join(',') },
    });
  }

  getDownloadUrl(
    attachmentId: string,
    options?: ApiRequestOptions,
  ): Observable<AttachmentDownloadResponseDto> {
    return this.api.get<AttachmentDownloadResponseDto>(
      `/attachments/${encodeURIComponent(attachmentId)}/download-url`,
      options,
    );
  }
}
