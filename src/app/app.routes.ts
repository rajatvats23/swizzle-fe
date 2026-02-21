import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component')
        .then(m => m.LoginComponent),
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./features/admin/layout/admin-layout.component')
        .then(m => m.AdminLayoutComponent),
    canActivate: [roleGuard('admin', 'manager', 'kitchen')],
    children: [
      {
        path: '',
        redirectTo: 'menu',
        pathMatch: 'full',
      },
      {
        path: 'menu',
        loadComponent: () =>
          import('./features/admin/menu/admin-menu.component')
            .then(m => m.AdminMenuComponent),
      },
      {
        path: 'addons',
        loadComponent: () =>
          import('./features/admin/addons/admin-addons.component')
            .then(m => m.AdminAddonsComponent),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/admin/orders/admin-orders.component')
            .then(m => m.AdminOrdersComponent),
      },
      {
        path: 'kitchen',
        loadComponent: () =>
          import('./features/admin/kitchen/kitchen-display.component')
            .then(m => m.KitchenDisplayComponent),
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./features/admin/analytics/admin-analytics.component')
            .then(m => m.AdminAnalyticsComponent),
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('./features/admin/customers/admin-customers.component')
            .then(m => m.AdminCustomersComponent),
      },
      {
        path: 'promos',
        loadComponent: () =>
          import('./features/admin/promos/admin-promos.component')
            .then(m => m.AdminPromosComponent),
      },
      {
        path: 'staff',
        loadComponent: () =>
          import('./features/admin/staff/admin-staff.component')
            .then(m => m.AdminStaffComponent),
      },
    ],
  },
  {
    path: 'order/:id',
    children: [
      {
        path: '',
        redirectTo: 'details',
        pathMatch: 'full'
      },
      {
        path: 'details',
        loadComponent: () =>
          import('./features/customer/customer-details/customer-details.component')
            .then(m => m.CustomerDetailsComponent)
      },
      {
        path: 'verify-otp',
        loadComponent: () =>
          import('./features/customer/verify-otp/verify-otp.component')
            .then(m => m.VerifyOtpComponent)
      },
      {
        path: 'address',
        loadComponent: () =>
          import('./features/customer/address/address.component')
            .then(m => m.AddressComponent)
      },
      {
        path: 'menu',
        loadComponent: () =>
          import('./features/customer/menu/menu.component')
            .then(m => m.MenuComponent)
      },
      {
        path: 'checkout',
        loadComponent: () =>
          import('./features/customer/checkout/checkout.component')
            .then(m => m.CheckoutComponent)
      },
      {
        path: 'feedback',
        loadComponent: () =>
          import('./features/customer/feedback/feedback.component')
            .then(m => m.FeedbackComponent)
      }
    ]
  },
  {
    path: 'receptionist',
    loadComponent: () =>
      import('./features/receptionist/dashboard/receptionist-dashboard.component')
        .then(m => m.ReceptionistDashboardComponent)
  },
  {
    path: 'mfa-setup',
    loadComponent: () =>
      import('./features/auth/mfa-setup/mfa-setup.component')
        .then(m => m.MfaSetupComponent),
  },
  {
    path: 'mfa-verify',
    loadComponent: () =>
      import('./features/auth/mfa-verify/mfa-verify.component')
        .then(m => m.MfaVerifyComponent),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
