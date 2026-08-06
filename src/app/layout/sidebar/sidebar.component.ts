import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Injector,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import type { ServiceOrdersStore as ServiceOrdersStoreInstance } from '../../features/service-orders/data/service-orders.store';
import { classNames } from '../../ui/utils/classnames';
import { APP_NAVIGATION_ITEMS } from '../app-navigation';
import { AppLayoutIconComponent } from '../layout-icon/layout-icon.component';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, TranslocoPipe, AppLayoutIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar.component.html',
})
export class AppSidebarComponent {
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly serviceOrdersStore = signal<ServiceOrdersStoreInstance | null>(null);

  protected readonly navigationItems = APP_NAVIGATION_ITEMS;
  protected readonly openServiceOrderCount = computed(
    () =>
      this.serviceOrdersStore()
        ?.orders()
        .filter((order) => order.status !== 'completed' && order.status !== 'cancelled').length ??
      0,
  );

  constructor() {
    void import('../../features/service-orders/data/service-orders.store')
      .then(({ ServiceOrdersStore }) => {
        if (this.destroyRef.destroyed) {
          return;
        }

        this.serviceOrdersStore.set(this.injector.get(ServiceOrdersStore));
      })
      .catch(() => undefined);
  }

  protected navLinkClasses(isActive: boolean): string {
    return classNames(
      'group flex min-h-10 items-center gap-3 rounded-button border px-2.5 py-2 text-body transition-colors duration-200 motion-reduce:transition-none',
      isActive
        ? 'border-brand bg-brand text-white'
        : 'border-transparent text-text-main hover:bg-action-soft',
    );
  }

  protected iconWrapperClasses(isActive: boolean): string {
    return classNames(
      'inline-flex size-4 shrink-0 items-center justify-center [&_svg]:size-4',
      isActive ? 'text-white' : 'text-text-muted group-hover:text-brand',
    );
  }

  protected labelClasses(isActive: boolean): string {
    return classNames('min-w-0 truncate', isActive ? 'font-semibold text-white' : 'font-normal');
  }

  protected countClasses(isActive: boolean): string {
    return classNames(
      'ml-auto inline-flex min-h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[0.6875rem]/5 font-semibold',
      isActive ? 'bg-white/20 text-white' : 'bg-surface-muted text-text-muted',
    );
  }

  protected childLinkClasses(isActive: boolean): string {
    return classNames(
      'ui-focus-ring flex min-h-10 items-center rounded-button px-3 text-small transition-colors duration-200 motion-reduce:transition-none',
      isActive
        ? 'bg-action-soft font-semibold text-brand'
        : 'text-text-muted hover:bg-action-soft hover:text-text-main',
    );
  }
}
