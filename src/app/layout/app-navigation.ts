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
  readonly exact?: boolean;
}

export const APP_PRODUCT_NAME = 'HAVAC';
export const APP_PRODUCT_TAGLINE = 'Lekki SaaS dla serwisu HVAC';

export const APP_NAVIGATION_ITEMS: readonly AppNavigationItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: 'dashboard',
    exact: true,
  },
  {
    label: 'Klienci',
    path: '/customers',
    icon: 'customers',
    exact: false,
  },
  {
    label: 'Zgłoszenia',
    path: '/requests',
    icon: 'requests',
    exact: true,
  },
  {
    label: 'Przeglądy',
    path: '/reviews',
    icon: 'reviews',
    exact: true,
  },
  {
    label: 'Ustawienia',
    path: '/settings',
    icon: 'settings',
    exact: true,
  },
];
