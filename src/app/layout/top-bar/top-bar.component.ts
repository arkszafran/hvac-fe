import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { finalize } from 'rxjs';

import { AuthService } from '../../common/authentication';
import { TenantSwitcherComponent } from '../../features/tenants/components/tenant-switcher/tenant-switcher.component';
import { UiMenuComponent } from '../../ui';
import { APP_PRODUCT_NAME } from '../app-navigation';
import { AppLanguageSwitcherComponent } from '../language-switcher/language-switcher.component';
import { AppLayoutIconComponent } from '../layout-icon/layout-icon.component';

@Component({
  selector: 'app-top-bar',
  imports: [
    RouterLink,
    TranslocoPipe,
    UiMenuComponent,
    TenantSwitcherComponent,
    AppLanguageSwitcherComponent,
    AppLayoutIconComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './top-bar.component.html',
})
export class AppTopBarComponent {
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly menuRequested = output<void>();

  protected readonly productName = APP_PRODUCT_NAME;
  protected readonly currentUser = this.authService.user;
  protected readonly isLogoutPending = signal(false);
  protected readonly userDisplayName = computed(() => {
    const user = this.currentUser();

    return user?.name || user?.email || '';
  });
  protected readonly userInitials = computed(() => createUserInitials(this.userDisplayName()));

  protected logout(): void {
    if (this.isLogoutPending()) {
      return;
    }

    this.isLogoutPending.set(true);

    this.authService
      .logout()
      .pipe(
        finalize(() => {
          this.isLogoutPending.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}

function createUserInitials(value: string): string {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return '?';
  }

  const displayValue = normalizedValue.includes('@')
    ? normalizedValue.slice(0, normalizedValue.indexOf('@'))
    : normalizedValue;
  const nameParts = displayValue.split(/[\s._-]+/).filter(Boolean);
  const firstInitial = nameParts[0]?.[0] ?? '';
  const secondInitial =
    nameParts.length > 1 ? (nameParts[nameParts.length - 1]?.[0] ?? '') : (nameParts[0]?.[1] ?? '');

  return `${firstInitial}${secondInitial}`.toUpperCase();
}
