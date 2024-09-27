import { AsyncPipe } from '@angular/common';
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
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { EntityModule } from 'app/modules/entity/entity.module';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox.component';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxFileInputComponent } from 'app/modules/forms/ix-forms/components/ix-file-input/ix-file-input.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxRadioGroupComponent } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import {
  IxModalHeaderComponent,
} from 'app/modules/forms/ix-forms/components/ix-slide-in/components/ix-modal-header/ix-modal-header.component';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import {
  IxTableColumnsSelectorComponent,
} from 'app/modules/ix-table/components/ix-table-columns-selector/ix-table-columns-selector.component';
import {
  IxTableDetailsRowComponent,
} from 'app/modules/ix-table/components/ix-table-details-row/ix-table-details-row.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableCellDirective } from 'app/modules/ix-table/directives/ix-table-cell.directive';
import { IxTableDetailsRowDirective } from 'app/modules/ix-table/directives/ix-table-details-row.directive';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import {
  WithLoadingStateDirective,
} from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { SummaryComponent } from 'app/modules/summary/summary.component';
import { TerminalModule } from 'app/modules/terminal/terminal.module';
import { TestDirective } from 'app/modules/test-id/test.directive';
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
    EntityModule,
    IxIconComponent,
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
    TranslateModule,
    SearchInput1Component,
    SummaryComponent,
    EmptyComponent,
    FileSizePipe,
    IxModalHeaderComponent,
    IxFieldsetComponent,
    IxSelectComponent,
    IxCheckboxComponent,
    IxInputComponent,
    FormActionsComponent,
    IxExplorerComponent,
    IxComboboxComponent,
    IxErrorsComponent,
    IxFileInputComponent,
    IxRadioGroupComponent,
    PageHeaderModule,
    AsyncPipe,
    RequiresRolesDirective,
    UiSearchDirective,
    IxTableComponent,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTableEmptyDirective,
    IxTableCellDirective,
    IxTablePagerComponent,
    IxTableDetailsRowDirective,
    IxTableDetailsRowComponent,
    IxTableColumnsSelectorComponent,
    TestDirective,
    WithLoadingStateDirective,
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
