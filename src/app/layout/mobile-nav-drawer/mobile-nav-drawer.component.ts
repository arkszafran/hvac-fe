import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
  output,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { classNames } from '../../ui/utils/classnames';
import { UiDrawerComponent } from '../../ui';
import { APP_NAVIGATION_ITEMS } from '../app-navigation';
import { AppLayoutIconComponent } from '../layout-icon/layout-icon.component';

@Component({
  selector: 'app-mobile-nav-drawer',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslocoPipe, UiDrawerComponent, AppLayoutIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-drawer
      [open]="open()"
      (close)="close.emit()"
    >
      <nav class="flex flex-col gap-2">
        @for (item of navigationItems; track item.path) {
          <div class="space-y-1.5">
            <a
              [routerLink]="item.path"
              [queryParams]="item.queryParams"
              routerLinkActive
              #rla="routerLinkActive"
              [routerLinkActiveOptions]="item.activeMatchOptions ?? { exact: item.exact ?? true }"
              [class]="navLinkClasses(rla.isActive)"
              (click)="close.emit()"
            >
              <span [class]="iconWrapperClasses(rla.isActive)">
                <app-layout-icon [name]="item.icon" />
              </span>

              <span [class]="labelClasses(rla.isActive)">
                {{ item.labelKey | transloco }}
              </span>
            </a>

            @if (item.children?.length) {
              <div class="ml-4 space-y-1 pl-4">
                @for (child of item.children; track child.labelKey) {
                  <a
                    [routerLink]="child.path"
                    [queryParams]="child.queryParams"
                    routerLinkActive
                    #childRla="routerLinkActive"
                    [routerLinkActiveOptions]="child.activeMatchOptions ?? { exact: true }"
                    [class]="childLinkClasses(childRla.isActive)"
                    (click)="close.emit()"
                  >
                    <span>{{ child.labelKey | transloco }}</span>
                  </a>
                }
              </div>
            }
          </div>
        }
      </nav>
    </ui-drawer>
  `,
})
export class AppMobileNavDrawerComponent {
  readonly open = input(false, { transform: booleanAttribute });
  readonly close = output<void>();

  protected readonly navigationItems = APP_NAVIGATION_ITEMS;

  protected navLinkClasses(isActive: boolean): string {
    return classNames(
      'group flex items-center gap-3 rounded-[1rem] border px-3.5 py-3.5 transition duration-200',
      isActive
        ? 'border-primary/16 bg-[linear-gradient(135deg,_rgb(245_248_255/0.98),_rgb(233_240_255/0.96))] shadow-[0_18px_38px_-28px_rgb(24_74_160/0.38)]'
        : 'border-border/85 bg-white/84 hover:border-primary/16 hover:bg-primary-soft/34',
    );
  }

  protected iconWrapperClasses(isActive: boolean): string {
    return classNames(
      'flex size-10 shrink-0 items-center justify-center rounded-[0.9rem] border transition',
      isActive
        ? 'border-primary/18 bg-[linear-gradient(180deg,_var(--color-primary)_0%,_var(--color-primary-strong)_100%)] text-white shadow-[0_16px_30px_-24px_rgb(24_74_160/0.42)]'
        : 'border-border/80 bg-surface text-text-muted group-hover:border-primary/16 group-hover:bg-primary-soft/48 group-hover:text-primary-strong',
    );
  }

  protected labelClasses(isActive: boolean): string {
    return classNames(
      'min-w-0 text-label font-semibold transition duration-200',
      isActive ? 'text-primary-strong' : 'text-text-main group-hover:text-primary-strong',
    );
  }

  protected childLinkClasses(isActive: boolean): string {
    return classNames(
      'group flex items-center rounded-[0.85rem] px-3 py-2.5 text-[13px]/5 font-medium transition duration-200',
      isActive
        ? 'bg-primary-soft/52 text-primary-strong'
        : 'text-text-muted hover:bg-white/84 hover:text-text-main',
    );
  }
}
