import { Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { DevicesComponent } from 'app/pages/storage/modules/devices/devices.component';

export const devicesRoutes: Routes = [
  {
    path: '',
    data: { title: T('Devices'), breadcrumb: null },
    children: [
      {
        path: ':guid',
        pathMatch: 'full',
        component: DevicesComponent,
      },
    ],
  },
];
