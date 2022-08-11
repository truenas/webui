import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SnapshotListComponent } from 'app/pages/datasets/modules/snapshots/snapshot-list/snapshot-list.component';

export const routes: Routes = [
  {
    path: 'snapshots',
    data: { title: 'Snapshots' },
    children: [
      {
        path: '',
        component: SnapshotListComponent,
        data: { title: 'Snapshots', breadcrumb: 'Snapshots' },
      },
      {
        path: ':dataset',
        component: SnapshotListComponent,
        data: { title: 'Snapshots', breadcrumb: 'Snapshots' },
      },
    ],
  },
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
