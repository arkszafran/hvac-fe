import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AppMobileNavDrawerComponent } from '../mobile-nav-drawer/mobile-nav-drawer.component';
import { AppSidebarComponent } from '../sidebar/sidebar.component';
import { AppTopBarComponent } from '../top-bar/top-bar.component';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, AppMobileNavDrawerComponent, AppSidebarComponent, AppTopBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ui-page min-h-screen">
      <app-top-bar (menuRequested)="isMobileNavOpen.set(true)" />

      <div class="ui-shell py-4 md:py-6 lg:py-8">
        <div class="flex flex-col gap-4 md:flex-row md:items-start md:gap-6 lg:gap-8">
          <div class="hidden w-56 shrink-0 md:block">
            <app-sidebar />
          </div>

          <main class="min-w-0 flex-1">
            <div class="min-h-[calc(100vh-6.5rem)]">
              <router-outlet />
            </div>
          </main>
        </div>
      </div>

      <app-mobile-nav-drawer [open]="isMobileNavOpen()" (close)="isMobileNavOpen.set(false)" />
    </div>
  `,
})
export class AppShellComponent {
  protected readonly isMobileNavOpen = signal(false);
}
