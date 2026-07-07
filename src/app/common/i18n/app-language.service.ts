import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';

export type AppLanguage = 'pl' | 'en';

export interface AppLanguageOption {
  readonly code: AppLanguage;
  readonly label: string;
  readonly name: string;
}

export const APP_LANGUAGES: readonly AppLanguageOption[] = [
  { code: 'pl', label: 'PL', name: 'Polski' },
  { code: 'en', label: 'EN', name: 'English' },
];

const LANGUAGE_STORAGE_KEY = 'havac-language';
const DEFAULT_LANGUAGE: AppLanguage = 'pl';

@Injectable({ providedIn: 'root' })
export class AppLanguageService {
  private readonly document = inject(DOCUMENT);
  private readonly transloco = inject(TranslocoService);

  readonly activeLanguage = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  async initialize(): Promise<void> {
    await this.applyLanguage(this.readInitialLanguage(), false);
  }

  setLanguage(language: AppLanguage): void {
    void this.applyLanguage(language, true);
  }

  isActive(language: AppLanguage): boolean {
    return this.activeLanguage() === language;
  }

  private readInitialLanguage(): AppLanguage {
    return this.readStoredLanguage() ?? this.readBrowserLanguage() ?? DEFAULT_LANGUAGE;
  }

  private async applyLanguage(language: AppLanguage, shouldStoreLanguage: boolean): Promise<void> {
    await firstValueFrom(this.transloco.load(language));
    this.transloco.setActiveLang(language);
    this.document.documentElement.lang = language;

    if (shouldStoreLanguage) {
      this.writeStoredLanguage(language);
    }
  }

  private readStoredLanguage(): AppLanguage | null {
    try {
      return this.normalizeLanguage(this.document.defaultView?.localStorage.getItem(LANGUAGE_STORAGE_KEY));
    } catch {
      return null;
    }
  }

  private writeStoredLanguage(language: AppLanguage): void {
    try {
      this.document.defaultView?.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      return;
    }
  }

  private readBrowserLanguage(): AppLanguage | null {
    const browserLanguage = this.document.defaultView?.navigator.language;

    return this.normalizeLanguage(browserLanguage);
  }

  private normalizeLanguage(value: string | null | undefined): AppLanguage | null {
    const language = value?.toLowerCase().split('-')[0];

    return language === 'pl' || language === 'en' ? language : null;
  }
}
