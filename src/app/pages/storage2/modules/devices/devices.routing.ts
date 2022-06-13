import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DevicesComponent } from 'app/pages/storage2/modules/devices/components/devices/devices.component';

export const routes: Routes = [
  {
    path: '',
    data: { title: 'Devices' },
    component: DevicesComponent,
    children: [],
  },
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
