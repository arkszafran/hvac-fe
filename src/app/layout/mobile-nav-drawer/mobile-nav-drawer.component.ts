import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
  output,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { classNames } from '../../ui/utils/classnames';
import { UiDrawerComponent } from '../../ui';
import { APP_NAVIGATION_ITEMS } from '../app-navigation';
import { AppLayoutIconComponent } from '../layout-icon/layout-icon.component';

@Component({
  selector: 'app-mobile-nav-drawer',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, UiDrawerComponent, AppLayoutIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-drawer
      [open]="open()"
      (close)="close.emit()"
    >
      <nav class="flex flex-col gap-2">
        @for (item of navigationItems; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive
            #rla="routerLinkActive"
            [routerLinkActiveOptions]="{ exact: true }"
            [class]="navLinkClasses(rla.isActive)"
            (click)="close.emit()"
          >
            <span [class]="iconWrapperClasses(rla.isActive)">
              <app-layout-icon [name]="item.icon" />
            </span>

            <span class="min-w-0 text-label font-medium text-text-main">
              {{ item.label }}
            </span>
          </a>
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
      'group flex items-center gap-3 rounded-[1.45rem] border px-3.5 py-3.5 transition duration-200',
      isActive
        ? 'border-primary/12 bg-primary-soft/70 shadow-[0_18px_38px_-28px_rgb(0_102_255/0.38)]'
        : 'border-black/6 bg-white/74 hover:bg-white',
    );
  }

  protected iconWrapperClasses(isActive: boolean): string {
    return classNames(
      'flex size-10 shrink-0 items-center justify-center rounded-2xl transition',
      isActive
        ? 'bg-white text-primary shadow-[0_16px_30px_-24px_rgb(0_102_255/0.42)]'
        : 'bg-surface-muted text-text-muted group-hover:bg-white group-hover:text-text-main',
    );
  }
}
