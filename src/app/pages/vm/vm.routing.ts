import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DeviceEditComponent } from './devices/device-edit/';
import { DeviceListComponent } from './devices/device-list/';
import { VmFormComponent } from './vm-form/';
import { VMListComponent } from './vm-list/vm-list.component';
import { VMWizardComponent } from './vm-wizard/';
import { VMSerialShellComponent } from './vm-serial-shell';
import { DeviceAddComponent } from './devices/device-add2';

export const routes: Routes = [
  {
    path: '',
    data: { title: 'Virtual Machines', breadcrumb: 'Virtual Machines' },
    component: VMListComponent,
  },
  {
    path: 'edit/:pk', component: VmFormComponent,
    data: { title: 'Edit', breadcrumb: 'Edit' }
  },
  {
    path: 'add', component: VmFormComponent,
    data: { title: 'Add', breadcrumb: 'Add' },
  },
  {
    path: 'wizard',
    component: VMWizardComponent,
    data: { title: 'Wizard', breadcrumb: 'Wizard' },
  },
  {
    path: 'serial/:pk',
    component: VMSerialShellComponent,
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
      {
        path: 'add',
        data: { title: 'Add', breadcrumb: 'Add' },
        component: DeviceAddComponent,
      },
    ]
  },
  {
    path: ':vmid/devices/:name/edit/:pk/:dtype',
    component: DeviceEditComponent,
    data: { title: 'Edit Device', breadcrumb: 'Edit Device' }
  },
]
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
