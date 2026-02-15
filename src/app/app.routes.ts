import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => 
      import('./features/receptionist/dashboard/receptionist-dashboard.component')
        .then(m => m.ReceptionistDashboardComponent)
  },
//   {
//     path: 'order/:orderId',
//     loadComponent: () =>
//       import('./features/customer/customer-flow.component')
//         .then(m => m.CustomerFlowComponent)
//   }
];