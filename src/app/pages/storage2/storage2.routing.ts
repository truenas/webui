import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DatasetManagementComponent } from 'app/pages/storage2/components/dataset-management/dataset-management.component';
import { DeviceManagementComponent } from 'app/pages/storage2/components/device-management/device-management.component';
import { PoolsDashboardComponent } from 'app/pages/storage2/components/pools-dashboard/pools-dashboard.component';

export const routes: Routes = [
  {
    path: '',
    data: { title: 'Storage' },
    children: [
      {
        path: 'dashboard',
        data: { title: 'Pools Dashboard', breadcrumb: 'Pools Dashboard' },
        component: PoolsDashboardComponent,
      },
      {
        path: 'datasets',
        data: { title: 'Dataset Management', breadcrumb: 'Dataset Management' },
        component: DatasetManagementComponent,
      },
      {
        path: 'devices',
        data: { title: 'Device Management', breadcrumb: 'Device Management' },
        component: DeviceManagementComponent,
      },
    ],
  },
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
