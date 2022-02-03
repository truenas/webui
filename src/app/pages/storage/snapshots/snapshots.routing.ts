import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SnapshotTableComponent } from 'app/pages/storage/snapshots/snapshot-table/snapshot-table.component';

export const routes: Routes = [
  {
    path: 'snapshots',
    data: { title: 'Snapshots' },
    children: [
      {
        path: '',
        component: SnapshotTableComponent,
        data: { title: 'Snapshots', breadcrumb: 'Snapshots' },
      },
    ],
  },
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
