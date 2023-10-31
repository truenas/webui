import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SnapshotListComponent } from 'app/pages/datasets/modules/snapshots/snapshot-list/snapshot-list.component';

export const routes: Routes = [
  {
    path: 'snapshots',
    data: { title: 'Snapshots', breadcrumb: 'Snapshots' },
    children: [
      {
        path: '',
        component: SnapshotListComponent,
        data: { title: 'Snapshots', breadcrumb: null },
      },
      {
        path: ':dataset',
        component: SnapshotListComponent,
        data: { title: 'Snapshots', breadcrumb: null },
      },
    ],
  },
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
