import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { TranslateModule } from '@ngx-translate/core';
import { CoreComponents } from 'app/core/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { CastModule } from 'app/modules/cast/cast.module';
import { AppCommonModule } from 'app/modules/common/app-common.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { TerminalModule } from 'app/modules/terminal/terminal.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { DeviceFormComponent } from 'app/pages/vm/devices/device-form/device-form.component';
import { DeviceDeleteModalComponent } from 'app/pages/vm/devices/device-list/device-delete-modal/device-delete-modal.component';
import { VmEditFormComponent } from 'app/pages/vm/vm-edit-form/vm-edit-form.component';
import { VmSerialShellComponent } from 'app/pages/vm/vm-serial-shell/vm-serial-shell.component';
import { VmWizardComponent } from 'app/pages/vm/vm-wizard/vm-wizard.component';
import { NetworkService } from 'app/services/network.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { VmService } from 'app/services/vm.service';
import { DeviceListComponent } from './devices/device-list/device-list.component';
import { CloneVmDialogComponent } from './vm-list/clone-vm-dialog/clone-vm-dialog.component';
import { DeleteVmDialogComponent } from './vm-list/delete-vm-dialog/delete-vm-dialog.component';
import { StopVmDialogComponent } from './vm-list/stop-vm-dialog/stop-vm-dialog.component';
import { VmListComponent } from './vm-list/vm-list.component';
import { OsStepComponent } from './vm-wizard/steps/1-os-step/os-step.component';
import { CpuAndMemoryStepComponent } from './vm-wizard/steps/2-cpu-and-memory-step/cpu-and-memory-step.component';
import { DiskStepComponent } from './vm-wizard/steps/3-disk-step/disk-step.component';
import { NetworkInterfaceStepComponent } from './vm-wizard/steps/4-network-interface-step/network-interface-step.component';
import { InstallationMediaStepComponent } from './vm-wizard/steps/5-installation-media-step/installation-media-step.component';
import { GpuStepComponent } from './vm-wizard/steps/6-gpu-step/gpu-step.component';
import { UploadIsoDialogComponent } from './vm-wizard/upload-iso-dialog/upload-iso-dialog.component';
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
    TestIdModule,
    MatStepperModule,
    AppCommonModule,
  ],
  declarations: [
    VmListComponent,
    DeviceListComponent,
    VmSerialShellComponent,
    DeviceFormComponent,
    DeviceDeleteModalComponent,
    DeleteVmDialogComponent,
    StopVmDialogComponent,
    CloneVmDialogComponent,
    VmEditFormComponent,
    OsStepComponent,
    VmWizardComponent,
    CpuAndMemoryStepComponent,
    DiskStepComponent,
    NetworkInterfaceStepComponent,
    InstallationMediaStepComponent,
    GpuStepComponent,
    UploadIsoDialogComponent,
  ],
  providers: [
    VmService,
    NetworkService,
    SystemGeneralService,
  ],
})
export class VmModule { }
