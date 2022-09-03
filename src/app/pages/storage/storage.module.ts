import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../appMaterial.module';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { FlexLayoutModule } from '@angular/flex-layout';
import { NgxFilesizeModule } from 'ngx-filesize';
import { CommonDirectivesModule } from '../../directives/common/common-directives.module';

import { EntityModule } from '../common/entity/entity.module';
import { UserService } from '../../services/user.service';
import { StorageService } from '../../services/storage.service';

import { SnapshotAddComponent } from './snapshots/snapshot-add';
import { SnapshotCloneComponent } from './snapshots/snapshot-clone';
import { SnapshotDetailsComponent, SnapshotListComponent } from './snapshots/snapshot-list';
import { DatasetFormComponent } from './volumes/datasets/dataset-form';
import { DatasetPermissionsComponent } from './volumes/datasets/dataset-permissions';
import { DatasetAclComponent } from './volumes/datasets/dataset-acl';
import { ImportDiskComponent } from './import-disk/import-disk.component';

import { DiskComponent, ManagerComponent, VdevComponent } from './volumes/manager';
// import { VolumesEditComponent } from './volumes/volumes-edit/';
import { VolumesListComponent } from './volumes/volumes-list';
import { VolumeStatusComponent } from './volumes/volume-status';
import { MultipathsComponent } from './multipaths/multipaths.component';
import { routing } from './storage.routing';
import { ZvolFormComponent } from './volumes/zvol/zvol-form';
import { VMwareSnapshotFormComponent } from './VMware-snapshot/VMware-snapshot';
import { VMwareSnapshotListComponent } from './VMware-snapshot/VMware-snapshot-list';
import { DiskListComponent } from './disks/disk-list';
import { DiskFormComponent } from './disks/disk-form';
import { DiskBulkEditComponent } from './disks/disk-bulk-edit/disk-bulk-edit.component';
import { SmartResultsComponent } from './disks/smart-results/smart-results.component';
import { TreeTableModule } from 'primeng/treetable';
import { VolumeRekeyFormComponent } from 'app/pages/storage/volumes/volumerekey-form';
import { VolumeAddkeyFormComponent } from 'app/pages/storage/volumes/volumeaddkey-form';
import { VolumeCreatekeyFormComponent } from 'app/pages/storage/volumes/volumecreatekey-form/volumecreatekey-form.component';
import { VolumeChangekeyFormComponent } from 'app/pages/storage/volumes/volumechangekey-form/volumechangekey-form.component';
import { VolumeImportWizardComponent } from './volumes/volume-import-wizard';
import { MessageService } from '../common/entity/entity-form/services/message.service';
import { JobService } from 'app/services';
import { DatasetQuotasUserlistComponent } from './volumes/datasets/dataset-quotas/dataset-quotas-userlist/dataset-quotas-userlist.component';
import { DatasetQuotasGrouplistComponent } from './volumes/datasets/dataset-quotas/dataset-quotas-grouplist/dataset-quotas-grouplist.component';
import { UserQuotaFormComponent } from './volumes/datasets/dataset-quotas/dataset-quotas-userlist/user-quota-form/user-quota-form.component';
import { GroupQuotaFormComponent } from './volumes/datasets/dataset-quotas/dataset-quotas-grouplist/group-quota-form/group-quota-form.component';
import { SnapshotsBatchDeleteResultsDialogComponent } from 'app/pages/storage/snapshots/snapshot-list/components/batch-delete-results/snapshots-batch-delete-results-dialog.component';
import { DatasetUnlockComponent } from 'app/pages/storage/volumes/datasets/dataset-unlock/dataset-unlock.component';
import { UnlockDialogComponent } from 'app/pages/storage/volumes/datasets/dataset-unlock/unlock-dialog/unlock-dialog.component';

@NgModule({
  imports: [
    RouterModule, EntityModule, CommonModule, FormsModule,
    ReactiveFormsModule, routing, MaterialModule, TreeTableModule,
    NgxDatatableModule, TranslateModule, FlexLayoutModule,
    NgxFilesizeModule, CommonDirectivesModule,
  ],
  declarations: [
    VolumesListComponent,
    ManagerComponent,
    DiskComponent,
    VdevComponent,
    DatasetFormComponent,
    // VolumesEditComponent,
    VolumeRekeyFormComponent,
    VolumeAddkeyFormComponent,
    VolumeCreatekeyFormComponent,
    VolumeChangekeyFormComponent,
    SnapshotsBatchDeleteResultsDialogComponent,
    ZvolFormComponent,
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
  ],
  entryComponents: [SnapshotDetailsComponent, UnlockDialogComponent, SnapshotsBatchDeleteResultsDialogComponent],
  providers: [UserService, StorageService, MessageService, JobService, TranslateService],
})
export class StorageModule {
}
