import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { CoreComponents } from 'app/core/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { CastModule } from 'app/modules/cast/cast.module';
import { EntityFormService } from 'app/modules/entity/entity-form/services/entity-form.service';
import { MessageService } from 'app/modules/entity/entity-form/services/message.service';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { TerminalModule } from 'app/modules/terminal/terminal.module';
import { DeviceFormComponent } from 'app/pages/vm/devices/device-form/device-form.component';
import { DeviceDeleteModalComponent } from 'app/pages/vm/devices/device-list/device-delete-modal/device-delete-modal.component';
import { VmEditFormComponent } from 'app/pages/vm/vm-edit-form/vm-edit-form.component';
import { DisplayVmDialogComponent } from 'app/pages/vm/vm-list/display-vm-dialog/display-vm-dialog.component';
import { VmSerialShellComponent } from 'app/pages/vm/vm-serial-shell/vm-serial-shell.component';
import {
  VmService, NetworkService, SystemGeneralService,
} from 'app/services';
import { DeviceListComponent } from './devices/device-list/device-list.component';
import { CloneVmDialogComponent } from './vm-list/clone-vm-dialog/clone-vm-dialog.component';
import { DeleteVmDialogComponent } from './vm-list/delete-vm-dialog/delete-vm-dialog.component';
import { StopVmDialogComponent } from './vm-list/stop-vm-dialog/stop-vm-dialog.component';
import { VmListComponent } from './vm-list/vm-list.component';
import { VmWizardComponent } from './vm-wizard/vm-wizard.component';
import { routing } from './vm.routing';

@NgModule({
  imports: [
    CoreComponents,
    CommonDirectivesModule,
    EntityModule,
    CommonModule,
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
    CastModule,
    LayoutModule,
    MatDialogModule,
  ],
  declarations: [
    VmListComponent,
    DeviceListComponent,
    VmWizardComponent,
    VmSerialShellComponent,
    DeviceFormComponent,
    DeviceDeleteModalComponent,
    DeleteVmDialogComponent,
    StopVmDialogComponent,
    DisplayVmDialogComponent,
    CloneVmDialogComponent,
    VmEditFormComponent,
  ],
  providers: [
    VmService,
    EntityFormService,
    NetworkService,
    SystemGeneralService,
    MessageService,
  ],
})
export class VmModule { }
