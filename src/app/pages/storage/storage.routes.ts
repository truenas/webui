import { Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { AddVdevsComponent } from 'app/pages/storage/modules/pool-manager/components/add-vdevs/add-vdevs.component';
import { PoolsDashboardComponent } from 'app/pages/storage/pools-dashboard.component';

export const storageRoutes: Routes = [
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
        path: 'create',
        loadComponent: () => import('./modules/pool-manager/components/pool-manager/pool-manager.component').then((module) => module.PoolManagerComponent),
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
        loadChildren: () => import('./modules/devices/devices.routes').then((module) => module.devicesRoutes),
      },
      {
        path: ':poolId/add-vdevs',
        component: AddVdevsComponent,
        data: { title: T('Add Vdevs to Pool'), breadcrumb: T('Add Vdevs to Pool') },
      },
      {
        path: 'disks',
        loadChildren: () => import('./modules/disks/disks.routes').then((module) => module.diskRoutes),
        data: { title: T('Disks'), breadcrumb: T('Disks') },
      },
    ],
  },
];
