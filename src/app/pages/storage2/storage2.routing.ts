import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PoolsDashboardComponent } from 'app/pages/storage2/components/pools-dashboard/pools-dashboard.component';

export const routes: Routes = [
  {
    path: '',
    data: { title: 'Storage' },
    children: [
      {
        path: '',
        data: { title: 'Pools Dashboard', breadcrumb: 'Pools Dashboard' },
        component: PoolsDashboardComponent,
      },
      {
        path: ':poolId/devices',
        loadChildren: () => import('./modules/devices/devices.module').then((module) => module.DevicesModule),
        data: { title: 'Devices', breadcrumb: 'Devices' },
      },
    ],
  },
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
