import { ApiSuccessResponse } from '../api-response.model';

export type AttachmentContentType = 'image/jpeg' | 'image/png' | 'image/webp';
export type AttachmentScanStatus =
  | 'pending_upload'
  | 'scanning'
  | 'clean'
  | 'quarantined'
  | 'scan_failed'
  | 'upload_expired';

export interface PrepareAttachmentUploadFileDto {
  fileName: string;
  contentType: AttachmentContentType;
  sizeBytes: number;
  description?: string | null;
}

export interface PrepareAttachmentUploadsDto {
  files: PrepareAttachmentUploadFileDto[];
}

export interface AttachmentUploadFormDto {
  method: 'POST';
  url: string;
  fields: Record<string, string>;
  expiresAt: string;
}

export interface AttachmentDto {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  status: AttachmentScanStatus;
  canDownload: boolean;
  description?: string | null;
  uploadExpiresAt: string;
  uploadedAt: string | null;
  scanCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PreparedAttachmentDto {
  attachment: AttachmentDto;
  upload: AttachmentUploadFormDto;
}

export interface PrepareAttachmentUploadsDataDto {
  attachments: PreparedAttachmentDto[];
}

export type PrepareAttachmentUploadsResponseDto =
  ApiSuccessResponse<PrepareAttachmentUploadsDataDto>;

export interface AttachmentsListDataDto {
  attachments: AttachmentDto[];
}

export type AttachmentsListResponseDto = ApiSuccessResponse<AttachmentsListDataDto>;

export interface AttachmentDownloadDataDto {
  url: string;
  expiresAt: string;
}

export type AttachmentDownloadResponseDto = ApiSuccessResponse<AttachmentDownloadDataDto>;

export interface PhotoAttachmentDto {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  scanStatus: AttachmentScanStatus;
  canDownload: boolean;
  description?: string;
}

export interface ResolvedPhotoAttachmentDto extends PhotoAttachmentDto {
  url: string;
}
