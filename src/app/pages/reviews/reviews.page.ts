import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { AppPlaceholderPageComponent } from '../shared/placeholder-page.component';

@Component({
  selector: 'app-reviews-page',
  standalone: true,
  imports: [TranslocoPipe, AppPlaceholderPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-placeholder-page
      [eyebrow]="'pages.reviews.eyebrow' | transloco"
      [title]="'pages.reviews.title' | transloco"
      [description]="'pages.reviews.description' | transloco"
      [emptyTitle]="'pages.reviews.emptyTitle' | transloco"
      [emptyDescription]="'pages.reviews.emptyDescription' | transloco"
      [actionLabel]="'pages.reviews.actionLabel' | transloco"
      [checklist]="checklist()"
    />
  `,
})
export class ReviewsPageComponent {
  private readonly transloco = inject(TranslocoService);
  private readonly activeLanguage = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  protected readonly checklist = computed(() => {
    this.activeLanguage();

    return [
      this.transloco.translate('pages.reviews.checklist.calendar'),
      this.transloco.translate('pages.reviews.checklist.cards'),
      this.transloco.translate('pages.reviews.checklist.lightweight'),
    ];
  });
}
