import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DiskListComponent } from 'app/pages/storage/modules/disks/components/disk-list/disk-list.component';
import { SmartResultsComponent } from 'app/pages/storage/modules/disks/components/smart-results/smart-results.component';

export const routes: Routes = [
  {
    path: '',
    data: { title: 'Storage' },
    children: [
      {
        path: '',
        component: DiskListComponent,
        data: { title: 'Disks', breadcrumb: 'Disks' },
      },
      {
        path: 'smartresults/:type/:pk',
        component: SmartResultsComponent,
        data: { title: 'S.M.A.R.T. Test Results', breadcrumb: 'S.M.A.R.T. Test Results' },
      },
    ],
  },
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
