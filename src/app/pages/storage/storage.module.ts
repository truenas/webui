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
import { CoreComponents } from 'app/core/components/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { CastModule } from 'app/modules/cast/cast.module';
import { TooltipModule } from 'app/modules/tooltip/tooltip.module';
import { MessageService } from 'app/pages/common/entity/entity-form/services/message.service';
import { IxFormsModule } from 'app/pages/common/ix-forms/ix-forms.module';
import { DatasetFormComponent } from 'app/pages/storage/volumes/datasets/dataset-form/dataset-form.component';
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
import { EntityModule } from '../common/entity/entity.module';
import { DiskBulkEditComponent } from './disks/disk-bulk-edit/disk-bulk-edit.component';
import { DiskFormComponent } from './disks/disk-form/disk-form.component';
import { DiskListComponent } from './disks/disk-list/disk-list.component';
import { SmartResultsComponent } from './disks/smart-results/smart-results.component';
import { ImportDiskComponent } from './import-disk/import-disk.component';
import { SnapshotAddComponent } from './snapshots/snapshot-add/snapshot-add.component';
import { SnapshotCloneComponent } from './snapshots/snapshot-clone/snapshot-clone.component';
import { SnapshotDetailsComponent } from './snapshots/snapshot-list/components/snapshot-details.component';
import { SnapshotListComponent } from './snapshots/snapshot-list/snapshot-list.component';
import { routing } from './storage.routing';
import { VmwareSnapshotListComponent } from './vmware-snapshot/vmware-snapshot-list/vmware-snapshot-list.component';
import { VmwareSnapshotFormComponent } from './vmware-snapshot/vmware-snapshot/vmware-snapshot-form.component';
import { DatasetQuotasGrouplistComponent } from './volumes/datasets/dataset-quotas/dataset-quotas-grouplist/dataset-quotas-grouplist.component';
import { GroupQuotaFormComponent } from './volumes/datasets/dataset-quotas/dataset-quotas-grouplist/group-quota-form/group-quota-form.component';
import { DatasetQuotasUserlistComponent } from './volumes/datasets/dataset-quotas/dataset-quotas-userlist/dataset-quotas-userlist.component';
import { UserQuotaFormComponent } from './volumes/datasets/dataset-quotas/dataset-quotas-userlist/user-quota-form/user-quota-form.component';
import { DatasetUnlockComponent } from './volumes/datasets/dataset-unlock/dataset-unlock.component';
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
    RouterModule, EntityModule, CommonModule, FormsModule,
    ReactiveFormsModule, routing, MaterialModule, TreeTableModule,
    NgxDatatableModule, TranslateModule, FlexLayoutModule,
    NgxFilesizeModule, CommonDirectivesModule, CdkAccordionModule,
    TooltipModule, CoreComponents, CastModule, IxFormsModule,
  ],
  declarations: [
    VolumesListComponent,
    VolumesListControlsComponent,
    ManagerComponent,
    VdevComponent,
    DatasetFormComponent,
    VolumeRekeyFormComponent,
    VolumeAddkeyFormComponent,
    VolumeCreatekeyFormComponent,
    VolumeChangekeyFormComponent,
    ZvolFormComponent,
    ZvolWizardComponent,
    VolumeImportWizardComponent,
    SnapshotListComponent,
    SnapshotDetailsComponent,
    SnapshotCloneComponent,
    SnapshotAddComponent,
    ImportDiskComponent,
    DatasetTrivialPermissionsComponent,
    DatasetUnlockComponent,
    UnlockDialogComponent,
    VmwareSnapshotFormComponent,
    VmwareSnapshotListComponent,
    DiskListComponent,
    VolumeStatusComponent,
    DiskFormComponent,
    DiskBulkEditComponent,
    SmartResultsComponent,
    DatasetQuotasUserlistComponent,
    DatasetQuotasGrouplistComponent,
    UserQuotaFormComponent,
    GroupQuotaFormComponent,
    PermissionsSidebarComponent,
    PermissionsItemComponent,
    TrivialPermissionsComponent,
    PosixPermissionsComponent,
    NfsPermissionsComponent,
    DatasetAclEditorComponent,
    AclEditorListComponent,
    EditNfsAceComponent,
    EditPosixAceComponent,
    SelectPresetModalComponent,
    ExportDisconnectModalComponent,
  ],
  exports: [VolumesListControlsComponent],
  entryComponents: [SnapshotDetailsComponent, UnlockDialogComponent],
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
