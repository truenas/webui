import { CdkAccordionModule } from '@angular/cdk/accordion';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { NgxFilesizeModule } from 'ngx-filesize';
import { TreeTableModule } from 'primeng/treetable';
import { MaterialModule } from 'app/app-material.module';
import { CoreComponents } from 'app/core/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { AppLoaderModule } from 'app/modules/app-loader/app-loader.module';
import { CastModule } from 'app/modules/cast/cast.module';
import { MessageService } from 'app/modules/entity/entity-form/services/message.service';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { TooltipModule } from 'app/modules/tooltip/tooltip.module';
import { CreateSnapshotDialogComponent } from 'app/pages/storage/volumes/create-snapshot-dialog/create-snapshot-dialog.component';
import { DatasetFormComponent } from 'app/pages/storage/volumes/datasets/dataset-form/dataset-form.component';
import { DatasetUnlockComponent } from 'app/pages/storage/volumes/datasets/dataset-unlock/dataset-unlock.component';
import { DeleteDatasetDialogComponent } from 'app/pages/storage/volumes/delete-dataset-dialog/delete-dataset-dialog.component';
import { EncryptionOptionsDialogComponent } from 'app/pages/storage/volumes/encyption-options-dialog/encryption-options-dialog.component';
import { AclEditorListComponent } from 'app/pages/storage/volumes/permissions/components/acl-editor-list/acl-editor-list.component';
import { EditNfsAceComponent } from 'app/pages/storage/volumes/permissions/components/edit-nfs-ace/edit-nfs-ace.component';
import { EditPosixAceComponent } from 'app/pages/storage/volumes/permissions/components/edit-posix-ace/edit-posix-ace.component';
import { PermissionsItemComponent } from 'app/pages/storage/volumes/permissions/components/permissions-item/permissions-item.component';
import { SelectPresetModalComponent } from 'app/pages/storage/volumes/permissions/components/select-preset-modal/select-preset-modal.component';
import { NfsPermissionsComponent } from 'app/pages/storage/volumes/permissions/components/view-nfs-permissions/nfs-permissions.component';
import { PosixPermissionsComponent } from 'app/pages/storage/volumes/permissions/components/view-posix-permissions/posix-permissions.component';
import { TrivialPermissionsComponent } from 'app/pages/storage/volumes/permissions/components/view-trivial-permissions/trivial-permissions.component';
import { DatasetAclEditorComponent } from 'app/pages/storage/volumes/permissions/containers/dataset-acl-editor/dataset-acl-editor.component';
import { DatasetTrivialPermissionsComponent } from 'app/pages/storage/volumes/permissions/containers/dataset-trivial-permissions/dataset-trivial-permissions.component';
import { PermissionsSidebarComponent } from 'app/pages/storage/volumes/permissions/containers/permissions-sidebar/permissions-sidebar.component';
import { DatasetAclEditorStore } from 'app/pages/storage/volumes/permissions/stores/dataset-acl-editor.store';
import { PermissionsSidebarStore } from 'app/pages/storage/volumes/permissions/stores/permissions-sidebar.store';
import { VolumeAddkeyFormComponent } from 'app/pages/storage/volumes/volume-addkey-form/volume-addkey-form.component';
import { VolumeChangekeyFormComponent } from 'app/pages/storage/volumes/volume-changekey-form/volume-changekey-form.component';
import { VolumeCreatekeyFormComponent } from 'app/pages/storage/volumes/volume-createkey-form/volume-createkey-form.component';
import { VolumesListControlsComponent } from 'app/pages/storage/volumes/volume-list-controls/volumes-list-controls.component';
import { VolumeRekeyFormComponent } from 'app/pages/storage/volumes/volume-rekey-form/volume-rekey-form.component';
import { ExportDisconnectModalComponent } from 'app/pages/storage/volumes/volumes-list/components/export-disconnect-modal.component';
import { JobService } from 'app/services';
import { StorageService } from 'app/services/storage.service';
import { UserService } from 'app/services/user.service';
import { DiskBulkEditComponent } from './disks/disk-bulk-edit/disk-bulk-edit.component';
import { DiskFormComponent } from './disks/disk-form/disk-form.component';
import { DiskListComponent } from './disks/disk-list/disk-list.component';
import { SmartResultsComponent } from './disks/smart-results/smart-results.component';
import { ImportDiskComponent } from './import-disk/import-disk.component';
import { SnapshotsModule } from './snapshots/snapshots.module';
import { routing } from './storage.routing';
import { VmwareSnapshotListComponent } from './vmware-snapshot/vmware-snapshot-list/vmware-snapshot-list.component';
import { VmwareSnapshotFormComponent } from './vmware-snapshot/vmware-snapshot/vmware-snapshot-form.component';
import { DatasetQuotasGrouplistComponent } from './volumes/datasets/dataset-quotas/dataset-quotas-grouplist/dataset-quotas-grouplist.component';
import { GroupQuotaFormComponent } from './volumes/datasets/dataset-quotas/dataset-quotas-grouplist/group-quota-form/group-quota-form.component';
import { DatasetQuotasUserlistComponent } from './volumes/datasets/dataset-quotas/dataset-quotas-userlist/dataset-quotas-userlist.component';
import { UserQuotaFormComponent } from './volumes/datasets/dataset-quotas/dataset-quotas-userlist/user-quota-form/user-quota-form.component';
import { UnlockDialogComponent } from './volumes/datasets/dataset-unlock/unlock-dialog/unlock-dialog.component';
import { ManagerComponent } from './volumes/manager/manager.component';
import { VdevComponent } from './volumes/manager/vdev/vdev.component';
import { VolumeImportWizardComponent } from './volumes/volume-import-wizard/volume-import-wizard.component';
import { VolumeStatusComponent } from './volumes/volume-status/volume-status.component';
import { VolumesListComponent } from './volumes/volumes-list/volumes-list.component';
import { ZvolFormComponent } from './volumes/zvol/zvol-form/zvol-form.component';
import { ZvolWizardComponent } from './volumes/zvol/zvol-wizard/zvol-wizard.component';

@NgModule({
  imports: [
    AppLoaderModule,
    CastModule,
    CdkAccordionModule,
    CommonDirectivesModule,
    CommonModule,
    CoreComponents,
    EntityModule,
    FlexLayoutModule,
    FormsModule,
    IxFormsModule,
    IxTableModule,
    MaterialModule,
    NgxDatatableModule,
    NgxFilesizeModule,
    ReactiveFormsModule,
    RouterModule,
    routing,
    TooltipModule,
    TranslateModule,
    TreeTableModule,
    SnapshotsModule,
  ],
  declarations: [
    AclEditorListComponent,
    DatasetAclEditorComponent,
    DatasetFormComponent,
    DatasetQuotasGrouplistComponent,
    DatasetQuotasUserlistComponent,
    DatasetTrivialPermissionsComponent,
    CreateSnapshotDialogComponent,
    DatasetUnlockComponent,
    DeleteDatasetDialogComponent,
    DiskBulkEditComponent,
    DiskFormComponent,
    DiskListComponent,
    EditNfsAceComponent,
    EditPosixAceComponent,
    EncryptionOptionsDialogComponent,
    ExportDisconnectModalComponent,
    GroupQuotaFormComponent,
    ImportDiskComponent,
    ManagerComponent,
    NfsPermissionsComponent,
    PermissionsItemComponent,
    PermissionsSidebarComponent,
    PosixPermissionsComponent,
    SelectPresetModalComponent,
    SmartResultsComponent,
    TrivialPermissionsComponent,
    UnlockDialogComponent,
    UserQuotaFormComponent,
    VdevComponent,
    VmwareSnapshotFormComponent,
    VmwareSnapshotListComponent,
    VolumeAddkeyFormComponent,
    VolumeChangekeyFormComponent,
    VolumeCreatekeyFormComponent,
    VolumeImportWizardComponent,
    VolumeRekeyFormComponent,
    VolumesListComponent,
    VolumesListControlsComponent,
    VolumeStatusComponent,
    ZvolFormComponent,
    ZvolWizardComponent,
  ],
  exports: [VolumesListControlsComponent],
  providers: [
    UserService,
    StorageService,
    MessageService,
    JobService,
    TranslateService,
    PermissionsSidebarStore,
    DatasetAclEditorStore,
  ],
})
export class StorageModule {
}
