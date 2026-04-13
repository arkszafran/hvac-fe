import { Routes } from '@angular/router';

import { AppShellComponent } from './layout/app-shell/app-shell.component';

export const routes: Routes = [
  {
    path: '',
    component: AppShellComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.page').then(
            (module) => module.DashboardPageComponent,
          ),
      },
      {
        path: 'devices/new',
        loadComponent: () =>
          import('./pages/devices/device-create.page').then(
            (module) => module.DeviceCreatePageComponent,
          ),
      },
      {
        path: 'devices',
        loadComponent: () =>
          import('./pages/devices/devices.page').then((module) => module.DevicesPageComponent),
      },
      {
        path: 'customers/:customerId/devices/:deviceId',
        loadComponent: () =>
          import('./pages/customers/device-detail.page').then(
            (module) => module.DeviceDetailPageComponent,
          ),
      },
      {
        path: 'customers/:id',
        loadComponent: () =>
          import('./pages/customers/customer-detail.page').then(
            (module) => module.CustomerDetailPageComponent,
          ),
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('./pages/customers/customers.page').then(
            (module) => module.CustomersPageComponent,
          ),
      },
      {
        path: 'requests',
        loadComponent: () =>
          import('./pages/requests/requests.page').then(
            (module) => module.RequestsPageComponent,
          ),
      },
      {
        path: 'reviews',
        loadComponent: () =>
          import('./pages/reviews/reviews.page').then((module) => module.ReviewsPageComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/settings/settings.page').then(
            (module) => module.SettingsPageComponent,
          ),
      },
    ],
  },
  {
    path: 'style-guide',
    loadComponent: () =>
      import('./pages/style-guide/style-guide.page').then(
        (module) => module.StyleGuidePageComponent,
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
