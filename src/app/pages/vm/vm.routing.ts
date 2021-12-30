import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VmSerialShellComponent } from 'app/pages/vm/vm-serial-shell/vm-serial-shell.component';
import { DeviceAddComponent } from './devices/device-add/device-add.component';
import { DeviceEditComponent } from './devices/device-edit/device-edit.component';
import { DeviceListComponent } from './devices/device-list/device-list.component';
import { VmFormComponent } from './vm-form/vm-form.component';
import { VmListComponent } from './vm-list/vm-list.component';
import { VmWizardComponent } from './vm-wizard/vm-wizard.component';

export const routes: Routes = [
  {
    path: '',
    data: { title: 'Virtual Machines', breadcrumb: 'Virtual Machines' },
    component: VmListComponent,
  },
  {
    path: 'edit/:pk',
    component: VmFormComponent,
    data: { title: 'Edit', breadcrumb: 'Edit' },
  },
  {
    path: 'add',
    component: VmFormComponent,
    data: { title: 'Add', breadcrumb: 'Add' },
  },
  {
    path: 'wizard',
    component: VmWizardComponent,
    data: { title: 'Wizard', breadcrumb: 'Wizard' },
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
      {
        path: 'add',
        data: { title: 'Add', breadcrumb: 'Add' },
        component: DeviceAddComponent,
      },
    ],
  },
  {
    path: ':vmid/devices/:name/edit/:pk/:dtype',
    component: DeviceEditComponent,
    data: { title: 'Edit Device', breadcrumb: 'Edit Device' },
  },
];
export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
