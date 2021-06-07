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
import { VolumeAddkeyFormComponent } from 'app/pages/storage/volumes/volumeaddkey-form';
import { VolumeChangekeyFormComponent } from 'app/pages/storage/volumes/volumechangekey-form/volumechangekey-form.component';
import { VolumeCreatekeyFormComponent } from 'app/pages/storage/volumes/volumecreatekey-form/volumecreatekey-form.component';
import { VolumeRekeyFormComponent } from 'app/pages/storage/volumes/volumerekey-form';
import { JobService } from 'app/services';
import { StorageService } from 'app/services/storage.service';
import { UserService } from 'app/services/user.service';
import { MessageService } from '../common/entity/entity-form/services/message.service';
import { EntityModule } from '../common/entity/entity.module';
import { VMwareSnapshotFormComponent } from './VMware-snapshot/VMware-snapshot';
import { VMwareSnapshotListComponent } from './VMware-snapshot/VMware-snapshot-list';
import { DiskBulkEditComponent } from './disks/disk-bulk-edit/disk-bulk-edit.component';
import { DiskFormComponent } from './disks/disk-form';
import { DiskListComponent } from './disks/disk-list';
import { SmartResultsComponent } from './disks/smart-results/smart-results.component';
import { ImportDiskComponent } from './import-disk/import-disk.component';
import { MultipathsComponent } from './multipaths/multipaths.component';
import { SnapshotAddComponent } from './snapshots/snapshot-add';
import { SnapshotCloneComponent } from './snapshots/snapshot-clone';
import { SnapshotDetailsComponent, SnapshotListComponent } from './snapshots/snapshot-list';
import { routing } from './storage.routing';
import { DatasetAclComponent } from './volumes/datasets/dataset-acl';
import { DatasetFormComponent } from './volumes/datasets/dataset-form';
import { DatasetPermissionsComponent } from './volumes/datasets/dataset-permissions';
import { DatasetPosixAclComponent } from './volumes/datasets/dataset-posix-acl';
import { DatasetQuotasGrouplistComponent } from './volumes/datasets/dataset-quotas/dataset-quotas-grouplist/dataset-quotas-grouplist.component';
import { GroupQuotaFormComponent } from './volumes/datasets/dataset-quotas/dataset-quotas-grouplist/group-quota-form/group-quota-form.component';
import { DatasetQuotasUserlistComponent } from './volumes/datasets/dataset-quotas/dataset-quotas-userlist/dataset-quotas-userlist.component';
import { UserQuotaFormComponent } from './volumes/datasets/dataset-quotas/dataset-quotas-userlist/user-quota-form/user-quota-form.component';
import { DatasetUnlockComponent } from './volumes/datasets/dataset-unlock';
import { UnlockDialogComponent } from './volumes/datasets/dataset-unlock/unlock-dialog/unlock-dialog.component';
import { DiskComponent, ManagerComponent, VdevComponent } from './volumes/manager';
import { VolumeImportWizardComponent } from './volumes/volume-import-wizard';
import { VolumeStatusComponent } from './volumes/volume-status';
import { VolumesListControlsComponent } from './volumes/volumes-list/volumes-list-controls.component';
import { VolumesListComponent } from './volumes/volumes-list/volumes-list.component';
import { ZvolFormComponent } from './volumes/zvol/zvol-form';
import { ZvolWizardComponent } from './volumes/zvol/zvol-wizard';

@NgModule({
  imports: [
    RouterModule, EntityModule, CommonModule, FormsModule,
    ReactiveFormsModule, routing, MaterialModule, TreeTableModule,
    NgxDatatableModule, TranslateModule, FlexLayoutModule,
    NgxFilesizeModule, CommonDirectivesModule,
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
  ],
  exports: [VolumesListControlsComponent],
  entryComponents: [SnapshotDetailsComponent, UnlockDialogComponent],
  providers: [UserService, StorageService, MessageService, JobService, TranslateService],
})
export class StorageModule {
}
