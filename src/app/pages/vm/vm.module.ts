import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MaterialModule } from 'app/appMaterial.module';
import { TranslateModule } from '@ngx-translate/core';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  VmService, NetworkService, SystemGeneralService,
} from 'app/services';
import { EntityModule } from '../common/entity/entity.module';

import { EntityFormService } from '../common/entity/entity-form/services/entity-form.service';
import { MessageService } from '../common/entity/entity-form/services/message.service';

import { DeviceEditComponent } from './devices/device-edit/device-edit.component';
import { DeviceListComponent } from './devices/device-list';
import { VmFormComponent } from './vm-form';
import { VMListComponent } from './vm-list/vm-list.component';
import { routing } from './vm.routing';
import { CoreComponents } from 'app/core/components/corecomponents.module';
import { VMWizardComponent } from './vm-wizard';
import { VMSerialShellComponent } from './vm-serial-shell';
import { DeviceAddComponent } from './devices/device-add/device-add.component';

@NgModule({
  imports: [
    CoreComponents,
    EntityModule, CommonModule, FormsModule, TranslateModule,
    ReactiveFormsModule, routing, MaterialModule, FlexLayoutModule, // , BrowserModule
  ],
  declarations: [
    VMListComponent,
    VmFormComponent,
    DeviceListComponent,
    DeviceEditComponent,
    VMWizardComponent,
    VMSerialShellComponent,
    DeviceAddComponent,
  ],
  providers: [VmService, EntityFormService, NetworkService, SystemGeneralService, MessageService],
})
export class VmModule { }
