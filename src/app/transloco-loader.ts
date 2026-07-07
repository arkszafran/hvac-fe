import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Translation, TranslocoLoader } from '@jsverse/transloco';

import {
  SKIP_API_REDIRECT,
  SKIP_AUTH_REFRESH,
  SKIP_ERROR_TOAST,
  SKIP_GLOBAL_LOADER,
} from './common/api/api-context.tokens';

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private readonly http = inject(HttpClient);

  getTranslation(lang: string) {
    return this.http.get<Translation>(`assets/i18n/${lang}.json`, {
      context: new HttpContext()
        .set(SKIP_API_REDIRECT, true)
        .set(SKIP_AUTH_REFRESH, true)
        .set(SKIP_ERROR_TOAST, true)
        .set(SKIP_GLOBAL_LOADER, true),
    });
  }
}
