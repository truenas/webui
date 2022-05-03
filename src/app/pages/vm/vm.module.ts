import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { CoreComponents } from 'app/core/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { TerminalModule } from 'app/modules/terminal/terminal.module';
import { DeviceDeleteModalComponent } from 'app/pages/vm/devices/device-list/device-delete-modal/device-delete-modal.component';
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
    CommonDirectivesModule,
    EntityModule,
    CommonModule,
    FormsModule,
    TranslateModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatCardModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    routing,
    FlexLayoutModule,
    TerminalModule,
    IxFormsModule,
  ],
  declarations: [
    VmListComponent,
    VmFormComponent,
    DeviceListComponent,
    DeviceEditComponent,
    VmWizardComponent,
    VmSerialShellComponent,
    DeviceAddComponent,
    DeviceDeleteModalComponent,
  ],
  providers: [VmService, EntityFormService, NetworkService, SystemGeneralService, MessageService],
})
export class VmModule { }
