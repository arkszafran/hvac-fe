export type UiToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface UiToast {
  id: string;
  variant: UiToastVariant;
  message: string;
  title?: string;
  durationMs: number;
  createdAt: number;
}

export interface UiToastOptions {
  title?: string;
  durationMs?: number;
}
