import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FlexLayoutModule} from '@angular/flex-layout';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { MaterialModule } from '../../appMaterial.module';
import {EntityFormService} from '../../pages/common/entity/entity-form/services/entity-form.service';

//import { BrowserModule } from '@angular/platform-browser';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';

import {
  VmService, NetworkService, SystemGeneralService
} from '../../services'
import {EntityModule} from '../common/entity/entity.module';

import {DeviceAddComponent} from './devices/device-add/device-add.component';
import {DeviceCdromAddComponent} from './devices/device-cdrom-add/';
import {DeviceDeleteComponent} from './devices/device-delete/';
import {DeviceDiskAddComponent} from './devices/device-disk-add/';
import {DeviceEditComponent} from './devices/device-edit/';
import {DeviceRawFileAddComponent} from './devices/device-rawfile-add/';
import {DeviceListComponent} from './devices/device-list';
import {DeviceNicAddComponent} from './devices/device-nic-add/';
import {DeviceVncAddComponent} from './devices/device-vnc-add/';
import {VmFormComponent} from './vm-form/';
import {VmDeleteComponent} from './vm-delete/';
import {VmListComponent} from './vm-list/';
import {VmCardsComponent} from './vm-cards/vm-cards.component';
import {VmCardEditComponent} from './vm-cards/vm-card-edit.component';
import {VmTableComponent} from './vm-cards/vm-table.component';
import {routing} from './vm.routing';
import { VmSummaryComponent } from './vm-cards/vm-summary.component';
import { CoreComponents } from 'app/core/components/corecomponents.module';

@NgModule({
  imports : [
    CoreComponents,
    EntityModule, CommonModule, FormsModule,
	  ReactiveFormsModule, routing, MaterialModule, NgxDatatableModule, FlexLayoutModule//, BrowserModule
  ],
  declarations : [
    VmListComponent,
    VmCardsComponent,
    VmCardEditComponent,
    VmTableComponent,
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
    DeviceRawFileAddComponent,
    VmSummaryComponent,
  ],
  providers : [ VmService, EntityFormService, NetworkService, SystemGeneralService ]
})
/*
    export class VmModule {} import {
      NgaModule
    } from '../../theme/nga.module';
 */
export class VmModule {};
