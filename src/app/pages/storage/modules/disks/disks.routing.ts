import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { DiskListComponent } from 'app/pages/storage/modules/disks/components/disk-list/disk-list.component';
import { SmartResultsComponent } from 'app/pages/storage/modules/disks/components/smart-results/smart-results.component';

export const routes: Routes = [
  {
    path: '',
    data: { title: T('Storage') },
    children: [
      {
        path: '',
        component: DiskListComponent,
        data: { title: T('Disks'), breadcrumb: null },
      },
      {
        path: 'smartresults/:type/:pk',
        component: SmartResultsComponent,
        data: { title: T('S.M.A.R.T. Test Results'), breadcrumb: null },
      },
    ],
  },
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
