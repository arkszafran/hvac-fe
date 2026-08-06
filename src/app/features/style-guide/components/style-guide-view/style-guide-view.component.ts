import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import {
  UiBadgeComponent,
  UiBadgeVariant,
  UiButtonComponent,
  UiCardComponent,
  UiIconComponent,
  UiIconName,
  UiInputComponent,
  UiSelectComponent,
  UiSelectOption,
} from '../../../../ui';

interface ColorSwatch {
  color: string;
  labelKey: string;
  token: string;
}

interface StatusSample {
  labelKey: string;
  variant: UiBadgeVariant;
}

interface IconSample {
  labelKey: string;
  name: UiIconName;
}

@Component({
  selector: 'app-style-guide-view',
  imports: [
    ReactiveFormsModule,
    TranslocoPipe,
    UiBadgeComponent,
    UiButtonComponent,
    UiCardComponent,
    UiIconComponent,
    UiInputComponent,
    UiSelectComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './style-guide-view.component.html',
})
export class StyleGuideViewComponent {
  private readonly transloco = inject(TranslocoService);
  private readonly activeLanguage = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly statusControl = new FormControl('open', { nonNullable: true });
  protected readonly visitDateControl = new FormControl('', { nonNullable: true });
  protected readonly errorControl = new FormControl('', { nonNullable: true });

  protected readonly brandSwatches: ColorSwatch[] = [
    {
      labelKey: 'pages.styleGuide.colors.brand',
      color: 'var(--color-brand)',
      token: '0.42 0.07 245',
    },
    {
      labelKey: 'pages.styleGuide.colors.action',
      color: 'var(--color-action)',
      token: '0.58 0.11 220',
    },
    {
      labelKey: 'pages.styleGuide.colors.actionHover',
      color: 'var(--color-action-hover)',
      token: '0.51 0.115 220',
    },
    {
      labelKey: 'pages.styleGuide.colors.actionSoft',
      color: 'var(--color-action-soft)',
      token: '0.968 0.018 220',
    },
  ];

  protected readonly neutralSwatches: ColorSwatch[] = [
    {
      labelKey: 'pages.styleGuide.colors.textMain',
      color: 'var(--color-text-main)',
      token: '0.28 0.02 250',
    },
    {
      labelKey: 'pages.styleGuide.colors.textMuted',
      color: 'var(--color-text-secondary)',
      token: '0.58 0.015 250',
    },
    {
      labelKey: 'pages.styleGuide.colors.border',
      color: 'var(--color-border)',
      token: '0.92 0.008 250',
    },
    {
      labelKey: 'pages.styleGuide.colors.background',
      color: 'var(--color-background)',
      token: '0.975 0.004 240',
    },
    {
      labelKey: 'pages.styleGuide.colors.surface',
      color: 'var(--color-surface)',
      token: '1 0 0',
    },
  ];

  protected readonly statuses: StatusSample[] = [
    { labelKey: 'pages.styleGuide.statuses.contact', variant: 'warning' },
    { labelKey: 'pages.styleGuide.statuses.planned', variant: 'info' },
    { labelKey: 'pages.styleGuide.statuses.inProgress', variant: 'progress' },
    { labelKey: 'pages.styleGuide.statuses.completed', variant: 'success' },
    { labelKey: 'pages.styleGuide.statuses.cancelled', variant: 'neutral' },
  ];

  protected readonly iconSamples: IconSample[] = [
    { name: 'grid', labelKey: 'pages.styleGuide.icons.dashboard' },
    { name: 'users', labelKey: 'pages.styleGuide.icons.customers' },
    { name: 'device', labelKey: 'pages.styleGuide.icons.devices' },
    { name: 'check-square', labelKey: 'pages.styleGuide.icons.orders' },
    { name: 'calendar', labelKey: 'pages.styleGuide.icons.calendar' },
    { name: 'target', labelKey: 'pages.styleGuide.icons.target' },
    { name: 'phone', labelKey: 'pages.styleGuide.icons.phone' },
    { name: 'search', labelKey: 'pages.styleGuide.icons.search' },
    { name: 'help', labelKey: 'pages.styleGuide.icons.help' },
  ];

  protected readonly statusOptions = computed<UiSelectOption[]>(() => {
    this.activeLanguage();

    return [
      { value: 'open', label: this.transloco.translate('pages.styleGuide.form.open') },
      { value: 'closed', label: this.transloco.translate('pages.styleGuide.form.closed') },
    ];
  });
}
