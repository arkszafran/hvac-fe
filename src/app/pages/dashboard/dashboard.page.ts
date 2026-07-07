import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { AppPlaceholderPageComponent } from '../shared/placeholder-page.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [TranslocoPipe, AppPlaceholderPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-placeholder-page
      [eyebrow]="'pages.dashboard.eyebrow' | transloco"
      [title]="'pages.dashboard.title' | transloco"
      [description]="'pages.dashboard.description' | transloco"
      [emptyTitle]="'pages.dashboard.emptyTitle' | transloco"
      [emptyDescription]="'pages.dashboard.emptyDescription' | transloco"
      [actionLabel]="'pages.dashboard.actionLabel' | transloco"
      [checklist]="checklist()"
    />
  `,
})
export class DashboardPageComponent {
  private readonly transloco = inject(TranslocoService);
  private readonly activeLanguage = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  protected readonly checklist = computed(() => {
    this.activeLanguage();

    return [
      this.transloco.translate('pages.dashboard.checklist.header'),
      this.transloco.translate('pages.dashboard.checklist.content'),
      this.transloco.translate('pages.dashboard.checklist.placeholder'),
    ];
  });
}
