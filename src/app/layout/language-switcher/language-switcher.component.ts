import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

import {
  APP_LANGUAGES,
  AppLanguage,
  AppLanguageService,
} from '../../common/i18n/app-language.service';
import { classNames } from '../../ui/utils/classnames';

@Component({
  selector: 'app-language-switcher',
  imports: [TranslocoDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './language-switcher.component.html',
})
export class AppLanguageSwitcherComponent {
  private readonly languageService = inject(AppLanguageService);

  protected readonly languages = APP_LANGUAGES;

  protected isActive(language: AppLanguage): boolean {
    return this.languageService.isActive(language);
  }

  protected selectLanguage(language: AppLanguage): void {
    this.languageService.setLanguage(language);
  }

  protected buttonClasses(language: AppLanguage): string {
    return classNames(
      'ui-focus-ring inline-flex min-h-11 min-w-11 items-center justify-center rounded-[0.85rem] px-3 text-small font-semibold transition duration-200',
      this.isActive(language)
        ? 'bg-primary text-white shadow-[0_14px_28px_-20px_rgb(24_74_160/0.5)]'
        : 'text-text-muted hover:bg-primary-soft/55 hover:text-primary-strong active:bg-primary-soft',
    );
  }
}
