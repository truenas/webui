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
import {VmDeleteComponent} from './vm-delete/index';
import {VmListComponent} from './vm-list/';
import {DeviceRawFileAddComponent} from './devices/device-rawfile-add/'

export const routes: Routes = [
  {path : 'add', component : VmFormComponent},
  {path : 'edit/:pk', component : VmFormComponent},
  {path : 'delete/:pk', component : VmDeleteComponent},
  {path : ':pk/devices/:name', component : DeviceListComponent},
  {path : ':pk/devices/:name/cdrom/add', component : DeviceCdromAddComponent},
  {path : ':pk/devices/:name/disk/add', component : DeviceDiskAddComponent},
  {path : ':pk/devices/:name/nic/add', component : DeviceNicAddComponent},
  {path : ':pk/devices/:name/vnc/add', component : DeviceVncAddComponent},
  {path : ':pk/devices/:name/rawfile/add', component : DeviceRawFileAddComponent},
  {path : ':vmid/devices/:name/delete/:pk', component : DeviceDeleteComponent},
  {
    path : ':vmid/devices/:name/edit/:pk/:dtype',
    component : DeviceEditComponent
  },
  {path : '', component : VmListComponent, pathMatch : 'full'},
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
