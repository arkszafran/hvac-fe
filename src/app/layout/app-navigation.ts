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
  | 'visits'
  | 'reviews'
  | 'settings'
  | 'menu'
  | 'bell';

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
    labelKey: 'layout.navigation.requests',
    path: '/requests',
    icon: 'requests',
    exact: true,
  },
  {
    labelKey: 'layout.navigation.visits',
    path: '/visits',
    icon: 'visits',
    exact: false,
  },
  {
    labelKey: 'layout.navigation.inspections',
    path: '/inspections',
    queryParams: buildInspectionListViewQueryParams(DEFAULT_INSPECTION_LIST_VIEW_ID),
    icon: 'reviews',
    exact: false,
    activeMatchOptions: SECTION_MATCH,
    children: INSPECTION_LIST_VIEWS.map((view) => ({
      labelKey: view.labelKey,
      path: '/inspections',
      queryParams: buildInspectionListViewQueryParams(view.id),
      activeMatchOptions: EXACT_QUERY_MATCH,
    })),
  },
  {
    labelKey: 'layout.navigation.settings',
    path: '/settings',
    icon: 'settings',
    exact: true,
  },
];
