import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {DeviceEditComponent} from './devices/device-edit/';
import {DeviceListComponent} from './devices/device-list/';
import {VmFormComponent} from './vm-form/';
import {VmListComponent} from './vm-list/';
import {VMWizardComponent} from './vm-wizard/';
import {VMSerialShellComponent} from './vm-cards/vm-serial-shell';
import { DeviceAddComponent } from './devices/device-add2';

// export const routes: Routes = [
//   --{path : 'add', component : VmFormComponent},
//   --{path : 'edit/:pk', component : VmFormComponent},
//   --{path : 'delete/:pk', component : VmDeleteComponent},
//   {path : ':pk/devices/:name', component : DeviceListComponent},
//   {path : ':pk/devices/:name/cdrom/add', component : DeviceCdromAddComponent},
//   {path : ':pk/devices/:name/disk/add', component : DeviceDiskAddComponent},
//   {path : ':pk/devices/:name/nic/add', component : DeviceNicAddComponent},
//   {path : ':pk/devices/:name/vnc/add', component : DeviceVncAddComponent},
//   {path : ':pk/devices/:name/rawfile/add', component : DeviceRawFileAddComponent},
//   {path : ':vmid/devices/:name/delete/:pk', component : DeviceDeleteComponent},
//   {
//     path : ':vmid/devices/:name/edit/:pk/:dtype',
//     component : DeviceEditComponent
//   },
//   --{path : '', component : VmListComponent, pathMatch : 'full'},
// ];
export const routes: Routes = [
    {
      path: '',
      data: {title: 'Virtual Machines', breadcrumb:'Virtual Machines'},
      component : VmListComponent,
    },
    {
      path : 'edit/:pk', component : VmFormComponent,
      data: {title: 'Edit', breadcrumb: 'Edit'}
    },
    {
      path:'add', component : VmFormComponent,
      data: {title: 'Add', breadcrumb: 'Add'},
    },
    {
      path: 'wizard',
      component: VMWizardComponent,
      data: { title: 'Wizard', breadcrumb: 'Wizard'},
    },
    {
      path: 'serial/:pk',
      component: VMSerialShellComponent,
      data: { title: 'VM Serial Shell', breadcrumb: 'VM Serial Shell'},
    },
    {
      path : ':pk/devices/:name',
      data: {title: 'Devices', breadcrumb: 'Devices'},
      children: [
        {
          path:'',
          data: {title: 'Devices', breadcrumb: 'Devices'},
          component : DeviceListComponent,
        },
        {
          path:'add',
          data: {title: 'Add', breadcrumb: 'Add'},
          component : DeviceAddComponent,
        },
      ]
    },
    {
      path : ':vmid/devices/:name/edit/:pk/:dtype',
      component : DeviceEditComponent,
      data: {title: 'Edit Device', breadcrumb: 'Edit Device'}
     },
    ]
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
