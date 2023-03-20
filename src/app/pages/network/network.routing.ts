import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NetworkComponent } from './network.component';

export const routes: Routes = [
  {
    path: '',
    data: { title: 'Network' },
    children: [
      {
        path: '',
        component: NetworkComponent,
        data: { title: 'Network', breadcrumb: 'Network', icon: 'settings' },
      },
    ],
  },
];
export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
