import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideTransloco, translocoConfig } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';

import { AuthService } from './common/authentication';
import { AppLanguageService } from './common/i18n/app-language.service';
import { apiInterceptor } from './common/interceptors';
import { routes } from './app.routes';
import { TranslocoHttpLoader } from './transloco-loader';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([apiInterceptor])),
    provideRouter(routes),
    provideTransloco({
      config: translocoConfig({
        availableLangs: ['pl', 'en'],
        defaultLang: 'pl',
        fallbackLang: 'pl',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      }),
      loader: TranslocoHttpLoader,
    }),
    provideAppInitializer(() => inject(AppLanguageService).initialize()),
    provideAppInitializer(() => firstValueFrom(inject(AuthService).initialize())),
  ],
};
