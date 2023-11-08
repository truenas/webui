import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { DevicesComponent } from 'app/pages/storage/modules/devices/components/devices/devices.component';

export const routes: Routes = [
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

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
