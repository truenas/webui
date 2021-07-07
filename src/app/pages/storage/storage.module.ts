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
import { MaterialModule } from 'app/appMaterial.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { NfsPermissionsComponent } from 'app/pages/storage/volumes/permissions-sidebar/components/nfs-permissions/nfs-permissions.component';
import { PermissionsItemComponent } from 'app/pages/storage/volumes/permissions-sidebar/components/permissions-item/permissions-item.component';
import { PosixPermissionsComponent } from 'app/pages/storage/volumes/permissions-sidebar/components/posix-permissions/posix-permissions.component';
import { TrivialPermissionsComponent } from 'app/pages/storage/volumes/permissions-sidebar/components/trivial-permissions/trivial-permissions.component';
import { PermissionsSidebarComponent } from 'app/pages/storage/volumes/permissions-sidebar/permissions-sidebar.component';
import { PermissionsSidebarStore } from 'app/pages/storage/volumes/permissions-sidebar/permissions-sidebar.store';
import { VolumesListControlsComponent } from 'app/pages/storage/volumes/volume-list-controls/volumes-list-controls.component';
import { VolumeAddkeyFormComponent } from 'app/pages/storage/volumes/volumeaddkey-form/volumeaddkey-form.component';
import { VolumeChangekeyFormComponent } from 'app/pages/storage/volumes/volumechangekey-form/volumechangekey-form.component';
import { VolumeCreatekeyFormComponent } from 'app/pages/storage/volumes/volumecreatekey-form/volumecreatekey-form.component';
import { VolumeRekeyFormComponent } from 'app/pages/storage/volumes/volumerekey-form/volumerekey-form.component';
import { JobService } from 'app/services';
import { StorageService } from 'app/services/storage.service';
import { UserService } from 'app/services/user.service';
import { MessageService } from '../common/entity/entity-form/services/message.service';
import { EntityModule } from '../common/entity/entity.module';
import { VMwareSnapshotListComponent } from './VMware-snapshot/VMware-snapshot-list/VMware-snapshot-list.component';
import { VMwareSnapshotFormComponent } from './VMware-snapshot/VMware-snapshot/VMware-snapshot-form.component';
import { DiskBulkEditComponent } from './disks/disk-bulk-edit/disk-bulk-edit.component';
import { DiskFormComponent } from './disks/disk-form/disk-form.component';
import { DiskListComponent } from './disks/disk-list/disk-list.component';
import { SmartResultsComponent } from './disks/smart-results/smart-results.component';
import { ImportDiskComponent } from './import-disk/import-disk.component';
import { MultipathsComponent } from './multipaths/multipaths.component';
import { SnapshotAddComponent } from './snapshots/snapshot-add/snapshot-add.component';
import { SnapshotCloneComponent } from './snapshots/snapshot-clone/snapshot-clone.component';
import { SnapshotDetailsComponent } from './snapshots/snapshot-list/components/snapshot-details.component';
import { SnapshotListComponent } from './snapshots/snapshot-list/snapshot-list.component';
import { routing } from './storage.routing';
import { DatasetAclComponent } from './volumes/datasets/dataset-acl/dataset-acl.component';
import { DatasetFormComponent } from './volumes/datasets/dataset-form/dataset-form.component';
import { DatasetPermissionsComponent } from './volumes/datasets/dataset-permissions/dataset-permissions.component';
import { DatasetPosixAclComponent } from './volumes/datasets/dataset-posix-acl/dataset-posix-acl.component';
import { DatasetQuotasGrouplistComponent } from './volumes/datasets/dataset-quotas/dataset-quotas-grouplist/dataset-quotas-grouplist.component';
import { GroupQuotaFormComponent } from './volumes/datasets/dataset-quotas/dataset-quotas-grouplist/group-quota-form/group-quota-form.component';
import { DatasetQuotasUserlistComponent } from './volumes/datasets/dataset-quotas/dataset-quotas-userlist/dataset-quotas-userlist.component';
import { UserQuotaFormComponent } from './volumes/datasets/dataset-quotas/dataset-quotas-userlist/user-quota-form/user-quota-form.component';
import { DatasetUnlockComponent } from './volumes/datasets/dataset-unlock/dataset-unlock.component';
import { UnlockDialogComponent } from './volumes/datasets/dataset-unlock/unlock-dialog/unlock-dialog.component';
import { DiskComponent } from './volumes/manager/disk/disk.component';
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
  ],
  declarations: [
    VolumesListComponent,
    VolumesListControlsComponent,
    ManagerComponent,
    DiskComponent,
    VdevComponent,
    DatasetFormComponent,
    // VolumesEditComponent,
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
    DatasetPermissionsComponent,
    DatasetAclComponent,
    DatasetUnlockComponent,
    UnlockDialogComponent,
    VMwareSnapshotFormComponent,
    VMwareSnapshotListComponent,
    DiskListComponent,
    VolumeStatusComponent,
    MultipathsComponent,
    DiskFormComponent,
    DiskBulkEditComponent,
    SmartResultsComponent,
    DatasetQuotasUserlistComponent,
    DatasetQuotasGrouplistComponent,
    UserQuotaFormComponent,
    GroupQuotaFormComponent,
    DatasetPosixAclComponent,
    PermissionsSidebarComponent,
    PermissionsItemComponent,
    TrivialPermissionsComponent,
    PosixPermissionsComponent,
    NfsPermissionsComponent,
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
  ],
})
export class StorageModule {
}
