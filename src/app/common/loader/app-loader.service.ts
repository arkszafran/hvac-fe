import { Injectable, computed, signal } from '@angular/core';
import { Observable, finalize } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AppLoaderService {
  private readonly activeRequests = signal(0);

  readonly isLoading = computed(() => this.activeRequests() > 0);

  show(): void {
    this.activeRequests.update((count) => count + 1);
  }

  hide(): void {
    this.activeRequests.update((count) => Math.max(0, count - 1));
  }

  track<T>(source$: Observable<T>): Observable<T> {
    this.show();

    return source$.pipe(finalize(() => this.hide()));
  }

  async trackPromise<T>(promise: Promise<T>): Promise<T> {
    this.show();

    try {
      return await promise;
    } finally {
      this.hide();
    }
  }
}
