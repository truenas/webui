import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DeviceAddComponent } from '../vm/devices/device-add/device-add.component';
import { DeviceEditComponent } from '../vm/devices/device-edit/device-edit.component';
import { DeviceListComponent } from '../vm/devices/device-list';
import { VmFormComponent } from '../vm/vm-form';
import { VMListComponent } from '../vm/vm-list/vm-list.component';
import { VMSerialShellComponent } from '../vm/vm-serial-shell';
import { VMWizardComponent } from '../vm/vm-wizard';
import { JailFormComponent } from './jail-form/jail-form.component';
import { JailListComponent } from './jail-list';
import { JailShellComponent } from './jail-shell';
import { JailWizardComponent } from './jail-wizard';
import { StorageFormComponent } from './storages/storage-form';
import { StorageListComponent } from './storages/storage-list';

export const routes: Routes = [
  {
    path: '',
    data: { title: 'Jails', breadcrumb: 'Jails' },
    children: [
      {
        path: 'jails',
        component: JailListComponent,
      },
      {
        path: 'add',
        data: { title: 'Add', breadcrumb: 'Add' },
        children: [
          {
            path: '',
            redirectTo: 'wizard',
          },
          {
            path: 'advanced',
            component: JailFormComponent,
            data: { title: 'Advanced Jail Creation', breadcrumb: 'Advanced Jail Creation' },
          },
          {
            path: 'wizard',
            component: JailWizardComponent,
            data: { title: 'Wizard', breadcrumb: 'Wizard' },
          },
        ],
      }, {
        path: 'edit/:pk',
        component: JailFormComponent,
        data: { title: 'Edit', breadcrumb: 'Edit' },
      }, {
        path: 'shell/:pk',
        component: JailShellComponent,
        data: { title: 'Shell', breadcrumb: 'Shell' },
      }, {
        path: 'storage/:jail',
        data: { title: 'Mount Points', breadcrumb: 'Mount Points' },
        children: [
          {
            path: '',
            component: StorageListComponent,
          }, {
            path: 'add',
            component: StorageFormComponent,
            data: { title: 'Add', breadcrumb: 'Add' },
          }, {
            path: 'edit/:pk',
            component: StorageFormComponent,
            data: { title: 'Edit', breadcrumb: 'Edit' },
          },
        ],
      },

      {
        path: 'vm',
        data: { title: 'Virtual Machines', breadcrumb: 'Virtual Machines' },
        component: VMListComponent,
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
        ],
      },
      {
        path: ':vmid/devices/:name/edit/:pk/:dtype',
        component: DeviceEditComponent,
        data: { title: 'Edit Device', breadcrumb: 'Edit Device' },
      },
    ],
  },
];
export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
