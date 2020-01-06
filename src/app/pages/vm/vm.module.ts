import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MaterialModule } from '../../appMaterial.module';
import { TranslateModule } from '@ngx-translate/core';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  VmService, NetworkService, SystemGeneralService
} from '../../services'
import { EntityModule } from '../common/entity/entity.module';

import { EntityFormService } from '../../pages/common/entity/entity-form/services/entity-form.service';
import { MessageService } from '../../pages/common/entity/entity-form/services/message.service';

import { DeviceEditComponent } from './devices/device-edit/';
import { DeviceListComponent } from './devices/device-list';
import { VmFormComponent } from './vm-form/';
import { VMListComponent } from './vm-list/vm-list.component';
import { routing } from './vm.routing';
import { CoreComponents } from 'app/core/components/corecomponents.module';
import { VMWizardComponent } from './vm-wizard/';
import { VMSerialShellComponent } from './vm-serial-shell';
import { DeviceAddComponent } from './devices/device-add2';

@NgModule({
  imports: [
    CoreComponents,
    EntityModule, CommonModule, FormsModule, TranslateModule,
    ReactiveFormsModule, routing, MaterialModule, FlexLayoutModule//, BrowserModule
  ],
  declarations: [
    VMListComponent,
    VmFormComponent,
    DeviceListComponent,
    DeviceEditComponent,
    VMWizardComponent,
    VMSerialShellComponent,
    DeviceAddComponent
  ],
  providers: [VmService, EntityFormService, NetworkService, SystemGeneralService, MessageService]
})
export class VmModule { };
