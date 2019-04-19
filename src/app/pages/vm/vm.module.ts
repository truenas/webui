import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FlexLayoutModule} from '@angular/flex-layout';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { MaterialModule } from '../../appMaterial.module';
import {EntityFormService} from '../../pages/common/entity/entity-form/services/entity-form.service';
import {MessageService} from '../../pages/common/entity/entity-form/services/message.service';
import { TranslateModule } from '@ngx-translate/core';

//import { BrowserModule } from '@angular/platform-browser';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';

import {
  VmService, NetworkService, SystemGeneralService
} from '../../services'
import {EntityModule} from '../common/entity/entity.module';

import {DeviceEditComponent} from './devices/device-edit/';
import {DeviceListComponent} from './devices/device-list';
import {VmFormComponent} from './vm-form/';
import {VmListComponent} from './vm-list/';
import {VmCardsComponent} from './vm-cards/vm-cards.component';
import {VmCardEditComponent} from './vm-cards/vm-card-edit.component';
import {VmTableComponent} from './vm-cards/vm-table.component';
import {routing} from './vm.routing';
import { VmSummaryComponent } from './vm-cards/vm-summary.component';
import { CoreComponents } from 'app/core/components/corecomponents.module';
import { VMWizardComponent } from './vm-wizard/';
import {VMSerialShellComponent} from './vm-cards/vm-serial-shell';
import { DeviceAddComponent } from './devices/device-add2';

@NgModule({
  imports : [
    CoreComponents,
    EntityModule, CommonModule, FormsModule, TranslateModule,
	  ReactiveFormsModule, routing, MaterialModule, NgxDatatableModule, FlexLayoutModule//, BrowserModule
  ],
  declarations : [
    VmListComponent,
    VmCardsComponent,
    VmCardEditComponent,
    VmTableComponent,
    VmFormComponent,
    DeviceListComponent,
    DeviceEditComponent,
    VmSummaryComponent,
    VMWizardComponent,
    VMSerialShellComponent,
    DeviceAddComponent
  ],
  providers : [ VmService, EntityFormService, NetworkService, SystemGeneralService,MessageService ]
})
/*
    export class VmModule {} import {
      NgaModule
    } from '../../theme/nga.module';
 */
export class VmModule {};
