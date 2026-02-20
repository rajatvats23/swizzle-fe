
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'admin',
    loadComponent: () =>
      import('./features/admin/layout/admin-layout.component')
        .then(m => m.AdminLayoutComponent),
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
    path: '',
    redirectTo: 'receptionist',
    pathMatch: 'full'
  }
];