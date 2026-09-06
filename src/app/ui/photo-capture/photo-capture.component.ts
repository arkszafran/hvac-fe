import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { UiButtonComponent } from '../button/button.component';
import { UiFileInputComponent } from '../file-input/file-input.component';
import { UiModalComponent } from '../modal/modal.component';

const MAX_CAPTURE_EDGE = 1600;
const CAPTURE_JPEG_QUALITY = 0.88;
const CAMERA_PREVIEW_MAX_HEIGHT_DVH = 62;

export interface UiPhotoCaptureItem {
  id: string;
  fileName: string;
  url: string;
}

@Component({
  selector: 'ui-photo-capture',
  imports: [TranslocoPipe, UiButtonComponent, UiFileInputComponent, UiModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './photo-capture.component.html',
})
export class UiPhotoCaptureComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly cameraPreview = viewChild<ElementRef<HTMLVideoElement>>('cameraPreview');
  private readonly cameraStream = signal<MediaStream | null>(null);
  private cameraRequestId = 0;

  readonly label = input('');
  readonly hint = input('');
  readonly photos = input<readonly UiPhotoCaptureItem[]>([]);
  readonly multiple = input(true, { transform: booleanAttribute });

  readonly filesAdded = output<File[]>();
  readonly photoRemoved = output<string>();

  protected readonly isCameraOpen = signal(false);
  protected readonly isCameraStarting = signal(false);
  protected readonly isCameraReady = signal(false);
  protected readonly isCapturing = signal(false);
  protected readonly cameraErrorKey = signal('');
  protected readonly captureStatusKey = signal('');
  protected readonly selectedPhoto = signal<UiPhotoCaptureItem | null>(null);
  protected readonly cameraAspectRatio = signal(defaultCameraAspectRatio());
  protected readonly cameraFrameWidth = computed(
    () => `min(100%, ${(this.cameraAspectRatio() * CAMERA_PREVIEW_MAX_HEIGHT_DVH).toFixed(2)}dvh)`,
  );

  constructor() {
    effect(() => {
      const preview = this.cameraPreview()?.nativeElement;
      const stream = this.cameraStream();

      if (!preview) {
        return;
      }

      preview.srcObject = stream;
    });

    this.destroyRef.onDestroy(() => this.stopCamera());
  }

  protected async openCamera(): Promise<void> {
    this.stopCamera();
    const requestId = ++this.cameraRequestId;

    this.isCameraOpen.set(true);
    this.isCameraStarting.set(true);
    this.isCameraReady.set(false);
    this.cameraAspectRatio.set(defaultCameraAspectRatio());
    this.cameraErrorKey.set('');
    this.captureStatusKey.set('');

    if (!window.isSecureContext) {
      this.isCameraStarting.set(false);
      this.cameraErrorKey.set('ui.photoCapture.errors.secureContext');
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      this.isCameraStarting.set(false);
      this.cameraErrorKey.set('ui.photoCapture.errors.unsupported');
      return;
    }

    try {
      const stream = await requestCameraStream();

      if (!this.isCameraOpen() || requestId !== this.cameraRequestId) {
        stopMediaStream(stream);
        return;
      }

      this.cameraStream.set(stream);
    } catch (error: unknown) {
      this.cameraErrorKey.set(cameraErrorTranslationKey(error));
    } finally {
      this.isCameraStarting.set(false);
    }
  }

  protected closeCamera(): void {
    this.cameraRequestId += 1;
    this.stopCamera();
    this.isCameraOpen.set(false);
    this.isCameraStarting.set(false);
    this.isCameraReady.set(false);
    this.cameraErrorKey.set('');
    this.captureStatusKey.set('');
  }

  protected async capturePhoto(): Promise<void> {
    const preview = this.cameraPreview()?.nativeElement;

    if (!preview || !preview.videoWidth || !preview.videoHeight || this.isCapturing()) {
      this.cameraErrorKey.set('ui.photoCapture.errors.notReady');
      return;
    }

    this.isCapturing.set(true);
    this.cameraErrorKey.set('');
    this.captureStatusKey.set('');

    try {
      const canvas = document.createElement('canvas');
      const targetDimensions = calculateCaptureDimensions(preview.videoWidth, preview.videoHeight);
      canvas.width = targetDimensions.width;
      canvas.height = targetDimensions.height;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Canvas context is unavailable.');
      }

      context.drawImage(preview, 0, 0, canvas.width, canvas.height);
      const blob = await canvasToBlob(canvas);
      const file = new File([blob], createPhotoFileName(), { type: blob.type });

      this.filesAdded.emit([file]);
      this.captureStatusKey.set('ui.photoCapture.captured');

      if (!this.multiple()) {
        this.closeCamera();
      }
    } catch {
      this.cameraErrorKey.set('ui.photoCapture.errors.capture');
    } finally {
      this.isCapturing.set(false);
    }
  }

  protected handleCameraReady(): void {
    this.updateCameraDimensions();
    this.isCameraReady.set(true);
  }

  protected startCameraPreview(): void {
    const preview = this.cameraPreview()?.nativeElement;

    if (!preview || !this.cameraStream()) {
      return;
    }

    this.updateCameraDimensions();

    // Some mobile browsers reject the first play() while attaching the stream.
    // The muted autoplay attribute retries playback, so this transient rejection is not a camera error.
    void preview.play().catch(() => undefined);
  }

  protected updateCameraDimensions(): void {
    const preview = this.cameraPreview()?.nativeElement;
    const settings = this.cameraStream()?.getVideoTracks()[0]?.getSettings();
    const width = preview?.videoWidth || settings?.width || 0;
    const height = preview?.videoHeight || settings?.height || 0;

    if (!width || !height) {
      return;
    }

    this.cameraAspectRatio.set(width / height);
  }

  private stopCamera(): void {
    const stream = this.cameraStream();

    if (stream) {
      stopMediaStream(stream);
      this.cameraStream.set(null);
    }
  }
}

async function requestCameraStream(): Promise<MediaStream> {
  const preferredConstraints = createPreferredCameraConstraints();

  try {
    return await navigator.mediaDevices.getUserMedia(preferredConstraints);
  } catch (error: unknown) {
    if (!shouldRetryWithBasicConstraints(error)) {
      throw error;
    }

    return navigator.mediaDevices.getUserMedia({ audio: false, video: true });
  }
}

function createPreferredCameraConstraints(): MediaStreamConstraints {
  const isPortrait = isPortraitOrientation();

  return {
    audio: false,
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: isPortrait ? 1200 : MAX_CAPTURE_EDGE },
      height: { ideal: isPortrait ? MAX_CAPTURE_EDGE : 1200 },
    },
  };
}

function stopMediaStream(stream: MediaStream): void {
  for (const track of stream.getTracks()) {
    track.stop();
  }
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Photo could not be created.'))),
      'image/jpeg',
      CAPTURE_JPEG_QUALITY,
    );
  });
}

function calculateCaptureDimensions(
  sourceWidth: number,
  sourceHeight: number,
): { width: number; height: number } {
  const longestEdge = Math.max(sourceWidth, sourceHeight);

  if (longestEdge <= MAX_CAPTURE_EDGE) {
    return { width: sourceWidth, height: sourceHeight };
  }

  const scale = MAX_CAPTURE_EDGE / longestEdge;

  return {
    width: Math.round(sourceWidth * scale),
    height: Math.round(sourceHeight * scale),
  };
}

function defaultCameraAspectRatio(): number {
  return isPortraitOrientation() ? 3 / 4 : 4 / 3;
}

function isPortraitOrientation(): boolean {
  return window.matchMedia?.('(orientation: portrait)').matches ?? true;
}

function createPhotoFileName(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `photo-${timestamp}.jpg`;
}

function cameraErrorTranslationKey(error: unknown): string {
  if (!window.isSecureContext) {
    return 'ui.photoCapture.errors.secureContext';
  }

  if (!(error instanceof DOMException)) {
    return 'ui.photoCapture.errors.start';
  }

  if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
    return 'ui.photoCapture.errors.permission';
  }

  if (error.name === 'NotFoundError' || error.name === 'OverconstrainedError') {
    return 'ui.photoCapture.errors.missing';
  }

  if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
    return 'ui.photoCapture.errors.inUse';
  }

  return 'ui.photoCapture.errors.start';
}

function shouldRetryWithBasicConstraints(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError')
  );
}
