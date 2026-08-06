import { Routes } from '@angular/router';

import { authChildGuard, authGuard } from './common/authentication';
import { AppShellComponent } from './layout/app-shell/app-shell.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/authentication/login/login.page').then((module) => module.LoginPageComponent),
  },
  {
    path: 'auto-login',
    loadComponent: () =>
      import('./pages/authentication/auto-login/auto-login.page').then(
        (module) => module.AutoLoginPageComponent,
      ),
  },
  {
    path: 'account-blocked',
    loadComponent: () =>
      import('./pages/authentication/account-blocked/account-blocked.page').then(
        (module) => module.AccountBlockedPageComponent,
      ),
  },
  {
    path: 'account-unlock',
    loadComponent: () =>
      import('./pages/authentication/account-unlock/account-unlock.page').then(
        (module) => module.AccountUnlockPageComponent,
      ),
  },
  {
    path: 'pin-login',
    loadComponent: () =>
      import('./pages/authentication/pin-login/pin-login.page').then(
        (module) => module.PinLoginPageComponent,
      ),
  },
  {
    path: 'request-password-reset',
    loadComponent: () =>
      import('./pages/authentication/password-reset-request/password-reset-request.page').then(
        (module) => module.PasswordResetRequestPageComponent,
      ),
  },
  {
    path: 'password-reset',
    loadComponent: () =>
      import('./pages/authentication/password-reset/password-reset.page').then(
        (module) => module.PasswordResetPageComponent,
      ),
  },
  {
    path: 'setup-new-credentails',
    loadComponent: () =>
      import('./pages/authentication/setup-new-credentials/setup-new-credentials.page').then(
        (module) => module.SetupNewCredentialsPageComponent,
      ),
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    canActivateChild: [authChildGuard],
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
        path: 'devices/:deviceId',
        loadComponent: () =>
          import('./pages/devices/device-detail.page').then(
            (module) => module.DeviceDetailPageComponent,
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
        path: 'service-orders',
        loadComponent: () =>
          import('./pages/service-orders/service-orders.page').then(
            (module) => module.ServiceOrdersPageComponent,
          ),
        children: [
          {
            path: ':serviceOrderId',
            loadComponent: () =>
              import('./pages/service-orders/service-order-detail.page').then(
                (module) => module.ServiceOrderDetailPageComponent,
              ),
          },
        ],
      },
      {
        path: 'visits/new',
        loadComponent: () =>
          import('./pages/visits/visit-create.page').then(
            (module) => module.VisitCreatePageComponent,
          ),
      },
      {
        path: 'visits',
        loadComponent: () =>
          import('./pages/visits/visits.page').then((module) => module.VisitsPageComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/settings/settings.page').then((module) => module.SettingsPageComponent),
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
