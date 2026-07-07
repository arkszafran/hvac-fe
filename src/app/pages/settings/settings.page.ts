import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { AppPlaceholderPageComponent } from '../shared/placeholder-page.component';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [TranslocoPipe, AppPlaceholderPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-placeholder-page
      [eyebrow]="'pages.settings.eyebrow' | transloco"
      [title]="'pages.settings.title' | transloco"
      [description]="'pages.settings.description' | transloco"
      [emptyTitle]="'pages.settings.emptyTitle' | transloco"
      [emptyDescription]="'pages.settings.emptyDescription' | transloco"
      [actionLabel]="'pages.settings.actionLabel' | transloco"
      [checklist]="checklist()"
    />
  `,
})
export class SettingsPageComponent {
  private readonly transloco = inject(TranslocoService);
  private readonly activeLanguage = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  protected readonly checklist = computed(() => {
    this.activeLanguage();

    return [
      this.transloco.translate('pages.settings.checklist.groups'),
      this.transloco.translate('pages.settings.checklist.layout'),
      this.transloco.translate('pages.settings.checklist.placeholder'),
    ];
  });
}
