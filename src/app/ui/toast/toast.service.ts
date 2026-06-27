import { Injectable, signal } from '@angular/core';

import { environment } from '../../../environments/environment';
import { UiToast, UiToastOptions, UiToastVariant } from './toast.model';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toastState = signal<UiToast[]>([]);
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  readonly toasts = this.toastState.asReadonly();

  success(message: string, options?: UiToastOptions): string {
    return this.show('success', message, options);
  }

  error(message: string, options?: UiToastOptions): string {
    return this.show('error', message, options);
  }

  info(message: string, options?: UiToastOptions): string {
    return this.show('info', message, options);
  }

  warning(message: string, options?: UiToastOptions): string {
    return this.show('warning', message, options);
  }

  show(variant: UiToastVariant, message: string, options?: UiToastOptions): string {
    const id = createToastId();
    const durationMs = options?.durationMs ?? environment.toast.autoDismissMs;
    const toast: UiToast = {
      id,
      variant,
      message,
      title: options?.title,
      durationMs,
      createdAt: Date.now(),
    };

    this.toastState.update((toasts) => [...toasts, toast]);

    if (durationMs > 0) {
      this.timers.set(
        id,
        setTimeout(() => {
          this.dismiss(id);
        }, durationMs),
      );
    }

    return id;
  }

  dismiss(id: string): void {
    const timer = this.timers.get(id);

    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }

    this.toastState.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  clear(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }

    this.timers.clear();
    this.toastState.set([]);
  }
}

function createToastId(): string {
  return `toast-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
