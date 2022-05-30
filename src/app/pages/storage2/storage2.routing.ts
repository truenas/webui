import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DeviceManagementComponent } from 'app/pages/storage2/components/device-management/device-management.component';
import { PoolsDashboardComponent } from 'app/pages/storage2/components/pools-dashboard/pools-dashboard.component';

export const routes: Routes = [
  {
    path: '',
    data: { title: 'Storage' },
    children: [
      {
        path: 'pools/:poolId/manage-devices',
        data: { title: 'Device Management', breadcrumb: 'Device Management' },
        component: DeviceManagementComponent,
      },
      {
        path: '',
        data: { title: 'Pools Dashboard', breadcrumb: 'Pools Dashboard' },
        component: PoolsDashboardComponent,
      },
    ],
  },
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
