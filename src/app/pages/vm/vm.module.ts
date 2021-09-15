import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from 'app/app-material.module';
import { CoreComponents } from 'app/core/components/core-components.module';
import { TerminalModule } from 'app/pages/common/terminal/terminal.module';
import {
  VmService, NetworkService, SystemGeneralService,
} from 'app/services';
import { EntityFormService } from '../common/entity/entity-form/services/entity-form.service';
import { MessageService } from '../common/entity/entity-form/services/message.service';
import { EntityModule } from '../common/entity/entity.module';
import { DeviceAddComponent } from './devices/device-add/device-add.component';
import { DeviceEditComponent } from './devices/device-edit/device-edit.component';
import { DeviceListComponent } from './devices/device-list/device-list.component';
import { VmFormComponent } from './vm-form/vm-form.component';
import { VMListComponent } from './vm-list/vm-list.component';
import { VMSerialShellComponent } from './vm-serial-shell/vmserial-shell.component';
import { VMWizardComponent } from './vm-wizard/vm-wizard.component';
import { routing } from './vm.routing';

@NgModule({
  imports: [
    CoreComponents,
    EntityModule, CommonModule, FormsModule, TranslateModule,
    ReactiveFormsModule, routing, MaterialModule, FlexLayoutModule, // , BrowserModule
    TerminalModule,
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
