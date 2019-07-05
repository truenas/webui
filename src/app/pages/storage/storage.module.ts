import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../appMaterial.module';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { TranslateModule } from '@ngx-translate/core';

import { FlexLayoutModule } from '@angular/flex-layout';
import { FileSizeModule } from 'ngx-filesize';

import { EntityModule } from '../common/entity/entity.module';
import { UserService } from '../../services/user.service';
import { StorageService } from '../../services/storage.service';

import { SnapshotAddComponent } from './snapshots/snapshot-add/';
import { SnapshotCloneComponent } from './snapshots/snapshot-clone/';
import { SnapshotDetailsComponent, SnapshotListComponent } from './snapshots/snapshot-list/';
import { DatasetFormComponent } from './volumes/datasets/dataset-form/';
import { DatasetPermissionsComponent } from './volumes/datasets/dataset-permissions/';
import { DatasetAclComponent } from './volumes/datasets/dataset-acl/';
import {ImportDiskComponent} from './import-disk/import-disk.component';

import { DiskComponent, ManagerComponent, VdevComponent } from './volumes/manager/';
// import { VolumesEditComponent } from './volumes/volumes-edit/';
import { VolumeDeleteComponent } from './volumes/volume-delete/';
import { VolumesListComponent } from './volumes/volumes-list/';
import { VolumeStatusComponent } from './volumes/volume-status';
import { MultipathsComponent } from './multipaths/multipaths.component';
import { routing } from './storage.routing';
import { ZvolFormComponent } from './volumes/zvol/zvol-form'
import { VMwareSnapshotFormComponent } from './VMware-snapshot/VMware-snapshot';
import { VMwareSnapshotListComponent } from './VMware-snapshot/VMware-snapshot-list';
import { DiskListComponent } from './disks/disk-list/';
import { DiskFormComponent } from './disks/disk-form/';
import { DiskBulkEditComponent } from './disks/disk-bulk-edit/disk-bulk-edit.component';
import { DiskWipeComponent } from './disks/disk-wipe/disk-wipe.component';
import { TreeTableModule } from 'primeng/treetable';
import { VolumeRekeyFormComponent } from 'app/pages/storage/volumes/volumerekey-form';
import { VolumeAddkeyFormComponent } from 'app/pages/storage/volumes/volumeaddkey-form';
import { VolumeCreatekeyFormComponent } from 'app/pages/storage/volumes/volumecreatekey-form/volumecreatekey-form.component';
import { VolumeChangekeyFormComponent } from 'app/pages/storage/volumes/volumechangekey-form/volumechangekey-form.component';
import { VolumeImportWizardComponent} from './volumes/volume-import-wizard';
import { MessageService } from '../common/entity/entity-form/services/message.service';
import { JobService } from 'app/services';
import { DiskDetailsComponent } from './disks/disk-list/components/disk-details.component';

@NgModule({
  imports : [
    RouterModule, EntityModule, CommonModule, FormsModule,
    ReactiveFormsModule, routing, MaterialModule, TreeTableModule,
    NgxDatatableModule, TranslateModule, FlexLayoutModule,
    FileSizeModule
  ],
  declarations : [
    VolumesListComponent,
    ManagerComponent,
    DiskComponent,
    VdevComponent,
    DatasetFormComponent,
    VolumeDeleteComponent,
    VolumeRekeyFormComponent,
    VolumeAddkeyFormComponent,
    VolumeCreatekeyFormComponent,
    VolumeChangekeyFormComponent,
    ZvolFormComponent,
    VolumeImportWizardComponent,
    SnapshotListComponent,
    SnapshotDetailsComponent,
    SnapshotCloneComponent,
    SnapshotAddComponent,
    ImportDiskComponent,
    DatasetPermissionsComponent,
    DatasetAclComponent,
    VMwareSnapshotFormComponent,
    VMwareSnapshotListComponent,
    DiskListComponent,
    DiskDetailsComponent,
    VolumeStatusComponent,
    MultipathsComponent,
    DiskFormComponent,
    DiskWipeComponent,
    DiskBulkEditComponent
  ],
  entryComponents: [DiskDetailsComponent, SnapshotDetailsComponent],
  providers : [UserService, StorageService, MessageService, JobService]
})
export class StorageModule {
}
