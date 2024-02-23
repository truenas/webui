import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { CoreComponents } from 'app/core/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { CastModule } from 'app/modules/cast/cast.module';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFileSizeModule } from 'app/modules/ix-file-size/ix-file-size.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { SearchInput1Component } from 'app/modules/search-input1/search-input1.component';
import { SummaryComponent } from 'app/modules/summary/summary.component';
import { TerminalModule } from 'app/modules/terminal/terminal.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { DeviceFormComponent } from 'app/pages/vm/devices/device-form/device-form.component';
import { DeviceDeleteModalComponent } from 'app/pages/vm/devices/device-list/device-delete-modal/device-delete-modal.component';
import { VmEditFormComponent } from 'app/pages/vm/vm-edit-form/vm-edit-form.component';
import { VirtualMachineDetailsRowComponent } from 'app/pages/vm/vm-list/vm-details-row/vm-details-row.component';
import { VmListComponent } from 'app/pages/vm/vm-list/vm-list.component';
import { VmSerialShellComponent } from 'app/pages/vm/vm-serial-shell/vm-serial-shell.component';
import { VmWizardComponent } from 'app/pages/vm/vm-wizard/vm-wizard.component';
import { DeviceDetailsComponent } from './devices/device-list/device-details/device-details.component';
import { DeviceListComponent } from './devices/device-list/device-list/device-list.component';
import { CloneVmDialogComponent } from './vm-list/clone-vm-dialog/clone-vm-dialog.component';
import { DeleteVmDialogComponent } from './vm-list/delete-vm-dialog/delete-vm-dialog.component';
import { StopVmDialogComponent } from './vm-list/stop-vm-dialog/stop-vm-dialog.component';
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
    AppLoaderModule,
    CastModule,
    CommonDirectivesModule,
    CommonModule,
    CoreComponents,
    EntityModule,
    IxFormsModule,
    IxIconModule,
    IxTable2Module,
    LayoutModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatDividerModule,
    MatFormFieldModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatStepperModule,
    MatTooltipModule,
    ReactiveFormsModule,
    routing,
    TerminalModule,
    TestIdModule,
    TranslateModule,
    IxFileSizeModule,
    SearchInput1Component,
    SummaryComponent,
    EmptyComponent,
  ],
  declarations: [
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
    DeviceListComponent,
    DeviceDetailsComponent,
    VmListComponent,
    VirtualMachineDetailsRowComponent,
  ],
})
export class VmModule { }
