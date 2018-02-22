import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {DeviceCdromAddComponent} from './devices/device-cdrom-add/';
import {DeviceDeleteComponent} from './devices/device-delete/';
import {DeviceDiskAddComponent} from './devices/device-disk-add/';
import {DeviceEditComponent} from './devices/device-edit/';
import {DeviceListComponent} from './devices/device-list/';
import {DeviceNicAddComponent} from './devices/device-nic-add/';
import {DeviceVncAddComponent} from './devices/device-vnc-add/';
import {VmFormComponent} from './vm-form/';
import {VmListComponent} from './vm-list/';
import {DeviceRawFileAddComponent} from './devices/device-rawfile-add/'
import {VMWizardComponent} from './vm-wizard/'

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
      path : ':pk/devices/:name',
      data: {title: 'Devices', breadcrumb: 'Devices'},
      children: [
        {
          path:'',
          data: {title: 'Devices', breadcrumb: 'Devices'},
          component : DeviceListComponent,
        },
        {
          path:'cdrom/add',
          data: {title: 'CDROM Add', breadcrumb: 'CDROM Add'},
          component : DeviceCdromAddComponent,
        },
        {
          path:'nic/add',
          data: {title: '', breadcrumb: 'add'},
          component : DeviceNicAddComponent,
        },
        {
          path:'disk/add',
          data: {title: 'add', breadcrumb: 'add'},
          component : DeviceDiskAddComponent,
        },
        {
          path:'vnc/add',
          data: {title: 'add', breadcrumb: 'add'},
          component : DeviceVncAddComponent,
        },
        {
          path:'rawfile/add',
          data: {title: 'add', breadcrumb: 'add'},
          component : DeviceRawFileAddComponent,
        },
      ]
    },
    {
      path : ':vmid/devices/:name/edit/:pk/:dtype',
      component : DeviceEditComponent,
      data: {title: 'Edit Device', breadcrumb: 'Edit Device'}
     },
     {
      path : ':vmid/devices/:name/delete/:pk',
      component : DeviceDeleteComponent,
      data: {title: 'Delete Device', breadcrumb: 'Delete Device'}
     },
    ]
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
