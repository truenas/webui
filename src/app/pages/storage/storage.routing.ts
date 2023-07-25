import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { PoolsDashboardComponent } from 'app/pages/storage/components/pools-dashboard/pools-dashboard.component';
import { AddVdevsComponent } from 'app/pages/storage/modules/pool-manager/components/add-vdevs/add-vdevs.component';
import { ManagerComponent } from './components/manager/manager.component';

export const routes: Routes = [
  {
    path: '',
    data: { title: T('Storage') },
    children: [
      {
        path: '',
        data: { title: T('Storage Dashboard'), breadcrumb: T('Storage Dashboard') },
        component: PoolsDashboardComponent,
      },
      {
        path: 'create-legacy',
        component: ManagerComponent,
        data: { title: T('Create Pool (Legacy)'), breadcrumb: T('Create Pool (Legacy)') },
      },
      {
        path: 'create',
        loadChildren: () => import('./modules/pool-manager/pool-manager.module').then((module) => module.PoolManagerModule),
        data: { title: T('Pool Creation Wizard'), breadcrumb: T('Pool Creation Wizard') },
      },
      {
        path: ':poolId/devices',
        redirectTo: ':poolId/devices/',
        pathMatch: 'full',
      },
      {
        path: ':poolId/devices',
        data: { title: T('Devices'), breadcrumb: T('Devices') },
        loadChildren: () => import('./modules/devices/devices.module').then((module) => module.DevicesModule),
      },
      {
        path: ':poolId/add-vdevs',
        component: AddVdevsComponent,
        data: { title: T('Add Vdevs to Pool'), breadcrumb: T('Add Vdevs to Pool') },
      },
      {
        path: ':poolId/add-vdevs-legacy',
        component: ManagerComponent,
        data: { title: T('Add Vdevs to Pool (Legacy)'), breadcrumb: T('Add Vdevs to Pool (Legacy)') },
      },
      {
        path: 'disks',
        loadChildren: () => import('./modules/disks/disks.module').then((module) => module.DisksModule),
        data: { title: T('Disks'), breadcrumb: T('Disks') },
      },
    ],
  },
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
