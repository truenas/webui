import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DevicesComponent } from 'app/pages/storage/modules/devices/components/devices/devices.component';

export const routes: Routes = [
  {
    path: '',
    data: { title: 'Devices' },
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
