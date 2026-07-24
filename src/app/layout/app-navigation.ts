import { IsActiveMatchOptions, Params } from '@angular/router';

export type AppNavigationIcon =
  | 'dashboard'
  | 'customers'
  | 'devices'
  | 'service-orders'
  | 'visits'
  | 'settings'
  | 'menu'
  | 'bell'
  | 'log-out';

export interface AppNavigationChildItem {
  readonly labelKey: string;
  readonly path: string;
  readonly queryParams?: Params;
  readonly activeMatchOptions?: IsActiveMatchOptions;
}

export interface AppNavigationItem extends AppNavigationChildItem {
  readonly icon: AppNavigationIcon;
  readonly exact?: boolean;
  readonly children?: readonly AppNavigationChildItem[];
}

export const APP_PRODUCT_NAME = 'HAVAC';

export const APP_NAVIGATION_ITEMS: readonly AppNavigationItem[] = [
  {
    labelKey: 'layout.navigation.dashboard',
    path: '/dashboard',
    icon: 'dashboard',
    exact: true,
  },
  {
    labelKey: 'layout.navigation.customers',
    path: '/customers',
    icon: 'customers',
    exact: false,
  },
  {
    labelKey: 'layout.navigation.devices',
    path: '/devices',
    icon: 'devices',
    exact: false,
  },
  {
    labelKey: 'layout.navigation.serviceOrders',
    path: '/service-orders',
    icon: 'service-orders',
    exact: false,
  },
  {
    labelKey: 'layout.navigation.visits',
    path: '/visits',
    icon: 'visits',
    exact: false,
  },
  {
    labelKey: 'layout.navigation.settings',
    path: '/settings',
    icon: 'settings',
    exact: true,
  },
];
