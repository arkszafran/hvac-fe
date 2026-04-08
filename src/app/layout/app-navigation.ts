export type AppNavigationIcon =
  | 'dashboard'
  | 'customers'
  | 'requests'
  | 'reviews'
  | 'settings'
  | 'menu'
  | 'bell';

export interface AppNavigationItem {
  readonly label: string;
  readonly path: string;
  readonly icon: AppNavigationIcon;
}

export const APP_PRODUCT_NAME = 'HAVAC';
export const APP_PRODUCT_TAGLINE = 'Lekki SaaS dla serwisu HVAC';

export const APP_NAVIGATION_ITEMS: readonly AppNavigationItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: 'dashboard',
  },
  {
    label: 'Klienci',
    path: '/customers',
    icon: 'customers',
  },
  {
    label: 'Zgloszenia',
    path: '/requests',
    icon: 'requests',
  },
  {
    label: 'Przeglady',
    path: '/reviews',
    icon: 'reviews',
  },
  {
    label: 'Ustawienia',
    path: '/settings',
    icon: 'settings',
  },
];
