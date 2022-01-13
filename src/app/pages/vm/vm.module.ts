import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from 'app/app-material.module';
import { CoreComponents } from 'app/core/components/core-components.module';
import { TerminalModule } from 'app/modules/terminal/terminal.module';
import { VmSerialShellComponent } from 'app/pages/vm/vm-serial-shell/vm-serial-shell.component';
import {
  VmService, NetworkService, SystemGeneralService,
} from 'app/services';
import { EntityFormService } from '../../modules/entity/entity-form/services/entity-form.service';
import { MessageService } from '../../modules/entity/entity-form/services/message.service';
import { EntityModule } from '../../modules/entity/entity.module';
import { DeviceAddComponent } from './devices/device-add/device-add.component';
import { DeviceEditComponent } from './devices/device-edit/device-edit.component';
import { DeviceListComponent } from './devices/device-list/device-list.component';
import { VmFormComponent } from './vm-form/vm-form.component';
import { VmListComponent } from './vm-list/vm-list.component';
import { VmWizardComponent } from './vm-wizard/vm-wizard.component';
import { routing } from './vm.routing';

@NgModule({
  imports: [
    CoreComponents,
    EntityModule, CommonModule, FormsModule, TranslateModule,
    ReactiveFormsModule, routing, MaterialModule, FlexLayoutModule,
    TerminalModule,
  ],
  declarations: [
    VmListComponent,
    VmFormComponent,
    DeviceListComponent,
    DeviceEditComponent,
    VmWizardComponent,
    VmSerialShellComponent,
    DeviceAddComponent,
  ],
  providers: [VmService, EntityFormService, NetworkService, SystemGeneralService, MessageService],
})
export class VmModule { }
