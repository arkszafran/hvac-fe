import { IsActiveMatchOptions, Params } from '@angular/router';

import {
  DEFAULT_INSPECTION_LIST_VIEW_ID,
  INSPECTION_LIST_VIEWS,
  buildInspectionListViewQueryParams,
} from '../features/inspections/models/inspection-list-view.model';

export type AppNavigationIcon =
  | 'dashboard'
  | 'customers'
  | 'devices'
  | 'requests'
  | 'reviews'
  | 'settings'
  | 'menu'
  | 'bell';

export interface AppNavigationChildItem {
  readonly label: string;
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
export const APP_PRODUCT_TAGLINE = 'Lekki SaaS dla serwisu HVAC';

const EXACT_QUERY_MATCH: IsActiveMatchOptions = {
  paths: 'exact',
  queryParams: 'exact',
  fragment: 'ignored',
  matrixParams: 'ignored',
};

const SECTION_MATCH: IsActiveMatchOptions = {
  paths: 'subset',
  queryParams: 'ignored',
  fragment: 'ignored',
  matrixParams: 'ignored',
};

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
    label: 'Urzadzenia',
    path: '/devices',
    icon: 'devices',
    exact: false,
  },
  {
    label: 'Zgloszenia',
    path: '/requests',
    icon: 'requests',
    exact: true,
  },
  {
    label: 'Przeglady',
    path: '/inspections',
    queryParams: buildInspectionListViewQueryParams(DEFAULT_INSPECTION_LIST_VIEW_ID),
    icon: 'reviews',
    exact: false,
    activeMatchOptions: SECTION_MATCH,
    children: INSPECTION_LIST_VIEWS.map((view) => ({
      label: view.label,
      path: '/inspections',
      queryParams: buildInspectionListViewQueryParams(view.id),
      activeMatchOptions: EXACT_QUERY_MATCH,
    })),
  },
  {
    label: 'Ustawienia',
    path: '/settings',
    icon: 'settings',
    exact: true,
  },
];
