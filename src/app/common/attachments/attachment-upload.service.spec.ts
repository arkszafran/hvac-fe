import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';

import { AppLoaderService } from '../loader/app-loader.service';
import { ToastService } from '../../ui/toast/toast.service';
import { AttachmentUploadService, AttachmentUploadTask } from './attachment-upload.service';

const UPLOAD = {
  method: 'POST' as const,
  url: 'https://storage.googleapis.com/test-bucket/',
  fields: { key: 'tenant/attachment', policy: 'signed-policy' },
  expiresAt: '2026-09-09T18:00:00.000Z',
};

describe('AttachmentUploadService', () => {
  const trackPromise = vi.fn((promise: Promise<unknown>) => promise);
  const showError = vi.fn();
  let service: AttachmentUploadService;

  beforeEach(() => {
    trackPromise.mockClear();
    showError.mockClear();
    TestBed.configureTestingModule({
      providers: [
        AttachmentUploadService,
        { provide: AppLoaderService, useValue: { trackPromise } },
        { provide: ToastService, useValue: { error: showError } },
        {
          provide: TranslocoService,
          useValue: {
            translate: (key: string, params?: { fileName?: string }) =>
              `${key}:${params?.fileName ?? ''}`,
          },
        },
      ],
    });
    service = TestBed.inject(AttachmentUploadService);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('uploads signed fields before the file without credentials or custom headers', async () => {
    const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue({ ok: true, status: 204 } as Response);
    vi.stubGlobal('fetch', fetchMock);

    const result = await service.uploadFiles([createTask(file)]);
    const request = fetchMock.mock.calls[0];
    const options = request[1];
    const formData = options?.body as FormData;

    expect(request[0]).toBe(UPLOAD.url);
    expect(options?.method).toBe('POST');
    expect(options?.credentials).toBe('omit');
    expect(options?.headers).toBeUndefined();
    expect(Array.from(formData.keys())).toEqual(['key', 'policy', 'file']);
    expect(formData.get('file')).toBe(file);
    expect(trackPromise).toHaveBeenCalledOnce();
    expect(result).toEqual([
      { clientFileId: 'client-file-1', fileName: file.name, isUploaded: true },
    ]);
  });

  it('does not reject the visit flow when one storage upload fails', async () => {
    const file = new File(['photo'], 'failed.jpg', { type: 'image/jpeg' });
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue({ ok: false, status: 403 } as Response),
    );

    const result = await service.uploadFiles([createTask(file)]);

    expect(result[0].isUploaded).toBe(false);
    expect(showError).toHaveBeenCalledWith('attachments.upload.error:failed.jpg');
  });
});

function createTask(file: File): AttachmentUploadTask {
  return {
    clientFileId: 'client-file-1',
    file,
    upload: UPLOAD,
  };
}
