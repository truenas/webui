import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PoolsDashboardComponent } from 'app/pages/storage/components/pools-dashboard/pools-dashboard.component';
import { ManagerComponent } from './components/manager/manager.component';

export const routes: Routes = [
  {
    path: '',
    data: { title: 'Storage' },
    children: [
      {
        path: '',
        data: { title: 'Storage Dashboard', breadcrumb: 'Storage Dashboard' },
        component: PoolsDashboardComponent,
      },
      {
        path: 'create',
        component: ManagerComponent,
        data: { title: 'Create Pool', breadcrumb: 'Create Pool' },
      },
      {
        path: ':poolId/devices',
        redirectTo: ':poolId/devices/',
        pathMatch: 'full',
      },
      {
        path: ':poolId/devices',
        data: { title: 'Devices', breadcrumb: 'Devices' },
        loadChildren: () => import('./modules/devices/devices.module').then((module) => module.DevicesModule),
      },
      {
        path: ':poolId/add-vdevs',
        component: ManagerComponent,
        data: { title: 'Add Vdevs to Pool', breadcrumb: 'Add Vdevs to Pool' },
      },
      {
        path: 'disks',
        loadChildren: () => import('./modules/disks/disks.module').then((module) => module.DisksModule),
        data: { title: 'Disks', breadcrumb: 'Disks' },
      },
    ],
  },
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
