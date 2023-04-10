import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VmSerialShellComponent } from 'app/pages/vm/vm-serial-shell/vm-serial-shell.component';
import { DeviceListComponent } from './devices/device-list/device-list.component';
import { VmListComponent } from './vm-list/vm-list.component';

export const routes: Routes = [
  {
    path: '',
    data: { title: 'Virtual Machines', breadcrumb: 'Virtual Machines' },
    component: VmListComponent,
  },
  {
    path: 'serial/:pk',
    component: VmSerialShellComponent,
    data: { title: 'VM Serial Shell', breadcrumb: 'VM Serial Shell' },
  },
  {
    path: ':pk/devices/:name',
    data: { title: 'Devices', breadcrumb: 'Devices' },
    children: [
      {
        path: '',
        data: { title: 'Devices', breadcrumb: 'Devices' },
        component: DeviceListComponent,
      },
    ],
  },
];
export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
