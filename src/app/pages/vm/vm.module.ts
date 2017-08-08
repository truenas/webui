import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {DynamicFormsCoreModule} from '@ng2-dynamic-forms/core';
import {DynamicFormsBootstrapUIModule} from '@ng2-dynamic-forms/ui-bootstrap';

import {
  VmService
} from '../../services'

    @NgModule({
      imports : [
        EntityModule, DynamicFormsCoreModule.forRoot(),
        DynamicFormsBootstrapUIModule, CommonModule, FormsModule,
        ReactiveFormsModule, NgaModule, routing
      ],
      declarations : [
        VmListComponent,
        VmFormComponent,
        VmDeleteComponent,
        DeviceListComponent,
        DeviceCdromAddComponent,
        DeviceAddComponent,
        DeviceNicAddComponent,
        DeviceDiskAddComponent,
        DeviceVncAddComponent,
        DeviceDeleteComponent,
        DeviceEditComponent,
      ],
      providers : [ VmService ]
    }) export class VmModule {} import {
      NgaModule
    } from '../../theme/nga.module';
import {EntityModule} from '../common/entity/entity.module';

import {DeviceAddComponent} from './devices/device-add/device-add.component';
import {DeviceCdromAddComponent} from './devices/device-cdrom-add/';
import {DeviceDeleteComponent} from './devices/device-delete/';
import {DeviceDiskAddComponent} from './devices/device-disk-add/';
import {DeviceEditComponent} from './devices/device-edit/';
import {DeviceListComponent} from './devices/device-list';
import {DeviceNicAddComponent} from './devices/device-nic-add/';
import {DeviceVncAddComponent} from './devices/device-vnc-add/';
import {VmFormComponent} from './vm-form/';
import {VmDeleteComponent} from './vm-delete/';
import {VmListComponent} from './vm-list/';
import {routing} from './vm.routing';
