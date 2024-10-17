import { Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { SnapshotListComponent } from 'app/pages/datasets/modules/snapshots/snapshot-list/snapshot-list.component';

export const snapshotsRoutes: Routes = [
  {
    path: 'snapshots',
    data: { title: T('Snapshots'), breadcrumb: T('Snapshots') },
    children: [
      {
        path: '',
        component: SnapshotListComponent,
        data: { title: T('Snapshots'), breadcrumb: null },
      },
      {
        path: ':dataset',
        component: SnapshotListComponent,
        data: { title: T('Snapshots'), breadcrumb: null },
      },
    ],
  },
];
