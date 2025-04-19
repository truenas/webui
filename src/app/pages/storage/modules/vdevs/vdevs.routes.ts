import { Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { VDevsComponent } from 'app/pages/storage/modules/vdevs/vdevs.component';

export const vDevsRoutes: Routes = [
  {
    path: '',
    data: { title: T('VDEVs'), breadcrumb: null },
    children: [
      {
        path: ':guid',
        pathMatch: 'full',
        component: VDevsComponent,
      },
    ],
  },
];
