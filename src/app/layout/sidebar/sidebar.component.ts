import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { classNames } from '../../ui/utils/classnames';
import { APP_NAVIGATION_ITEMS } from '../app-navigation';
import { AppLayoutIconComponent } from '../layout-icon/layout-icon.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, AppLayoutIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="hidden md:block">
      <div class="sticky top-24 rounded-[1.9rem] border border-white/72 bg-white/62 p-3 shadow-card backdrop-blur-xl">
        <nav class="flex flex-col gap-1.5">
          @for (item of navigationItems; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive
              #rla="routerLinkActive"
              [routerLinkActiveOptions]="{ exact: true }"
              [class]="navLinkClasses(rla.isActive)"
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
      </div>
    </aside>
  `,
})
export class AppSidebarComponent {
  protected readonly navigationItems = APP_NAVIGATION_ITEMS;

  protected navLinkClasses(isActive: boolean): string {
    return classNames(
      'group flex items-center gap-3 rounded-[1.4rem] px-3 py-3 transition duration-200',
      isActive
        ? 'bg-[linear-gradient(135deg,_rgb(255_255_255/0.96),_rgb(239_245_255/0.92))] shadow-[0_20px_38px_-28px_rgb(0_102_255/0.38)]'
        : 'hover:bg-white/76',
    );
  }

  protected iconWrapperClasses(isActive: boolean): string {
    return classNames(
      'flex size-10 shrink-0 items-center justify-center rounded-2xl border transition',
      isActive
        ? 'border-primary/10 bg-primary-soft text-primary'
        : 'border-black/6 bg-white/84 text-text-muted group-hover:border-black/10 group-hover:bg-white group-hover:text-text-main',
    );
  }
}
