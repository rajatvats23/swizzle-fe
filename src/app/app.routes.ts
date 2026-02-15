// src/app/app.routes.ts

import { Routes } from '@angular/router';

export const routes: Routes = [
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
      // Comment these out until we create them:
      // {
      //   path: 'verify-otp',
      //   loadComponent: () => 
      //     import('./features/customer/verify-otp/verify-otp.component')
      //       .then(m => m.VerifyOtpComponent)
      // },
      {
        path: 'address',
        loadComponent: () =>
          import('./features/customer/address/address.component')
            .then(m => m.AddressComponent)
      },
      // {
      //   path: 'menu',
      //   loadComponent: () => 
      //     import('./features/customer/menu/menu.component')
      //       .then(m => m.MenuComponent)
      // },
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