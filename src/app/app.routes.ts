import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/receptionist/dashboard/receptionist-dashboard.component')
        .then(m => m.ReceptionistDashboardComponent)
  },
  {
    path: 'order/:orderId/address',
    loadComponent: () =>
      import('./features/customer/address/address.component')
        .then(m => m.AddressComponent)
  },
  {
    path: 'order/:orderId/menu',
    loadComponent: () =>
      import('./features/customer/customer-flow.component')
        .then(m => m.CustomerFlowComponent)
  },
  {
    path: 'order/:orderId/checkout',
    loadComponent: () =>
      import('./features/customer/checkout/checkout.component')
        .then(m => m.CheckoutComponent)
  },
  {
    path: 'test',
    loadComponent: () =>
      import('./test-menu.component').then(m => m.TestMenuComponent)
  }
];