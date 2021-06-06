import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from 'app/appMaterial.module';
import { CoreComponents } from 'app/core/components/corecomponents.module';
import {
  VmService, NetworkService, SystemGeneralService,
} from 'app/services';
import { EntityFormService } from '../common/entity/entity-form/services/entity-form.service';
import { MessageService } from '../common/entity/entity-form/services/message.service';
import { EntityModule } from '../common/entity/entity.module';
import { DeviceAddComponent } from './devices/device-add/device-add.component';
import { DeviceEditComponent } from './devices/device-edit/device-edit.component';
import { DeviceListComponent } from './devices/device-list';
import { VmFormComponent } from './vm-form';
import { VMListComponent } from './vm-list/vm-list.component';
import { VMSerialShellComponent } from './vm-serial-shell';
import { VMWizardComponent } from './vm-wizard';
import { routing } from './vm.routing';

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
