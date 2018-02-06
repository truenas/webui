import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DragulaModule } from 'ng2-dragula';
import { MaterialModule } from '../../appMaterial.module';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';

import { EntityModule } from '../common/entity/entity.module';
import { UserService } from '../../services/user.service';
import { StorageService } from '../../services/storage.service';

import { SnapshotAddComponent } from './snapshots/snapshot-add/';
import { SnapshotCloneComponent } from './snapshots/snapshot-clone/';
import { SnapshotListComponent } from './snapshots/snapshot-list/';
import { SnapshotRollbackComponent } from './snapshots/snapshot-rollback/';
import { DatasetFormComponent } from './volumes/datasets/dataset-form/';
import { DatasetDeleteComponent } from './volumes/datasets/dataset-delete/';
import { DatasetPermissionsComponent } from './volumes/datasets/dataset-permissions/'
import { StatusComponent } from './volumes/status/status.component';
import {ImportDiskComponent} from './import-disk/import-disk.component';

import { DiskComponent, ManagerComponent, VdevComponent } from './volumes/manager/';
// import { VolumesEditComponent } from './volumes/volumes-edit/';
import { VolumeDeleteComponent } from './volumes/volume-delete/';
import { VolumesListComponent } from './volumes/volumes-list/';
import { VolumeImportListComponent } from './volumes/import-list/';
import { routing } from './storage.routing';
import { ZvolDeleteComponent } from './volumes/zvol/zvol-delete/';
import { ZvolAddComponent } from './volumes/zvol/zvol-add'
import { ZvolEditComponent } from './volumes/zvol/zvol-edit/';
import { VMwareSnapshotFormComponent } from './VMware-snapshot/VMware-snapshot';
import { VMwareSnapshotListComponent } from './VMware-snapshot/VMware-snapshot-list';
import { DisksListComponent } from './disks/disks-list/';
import { DiskFormComponent } from './disks/disk-form/';
import { DiskWipeComponent } from './disks/disk-wipe/disk-wipe.component';
import { BrowserModule } from '@angular/platform-browser';
import { DxTreeListModule } from 'devextreme-angular';
import { VolumeUnlockFormComponent } from 'app/pages/storage/volumes/volumeunlock-form';
import { VolumeRekeyFormComponent } from 'app/pages/storage/volumes/volumerekey-form';
import { VolumeAddkeyFormComponent } from 'app/pages/storage/volumes/volumeaddkey-form';


@NgModule({
  imports : [
    RouterModule, DragulaModule, EntityModule, CommonModule, FormsModule,
    ReactiveFormsModule, routing, MaterialModule,
    NgxDatatableModule, DxTreeListModule
  ],
  declarations : [
    VolumesListComponent,
    ManagerComponent,
    DiskComponent,
    VdevComponent,
    DatasetFormComponent,
    DatasetDeleteComponent,
    // VolumesEditComponent,
    VolumeDeleteComponent,
    VolumeUnlockFormComponent,
    VolumeRekeyFormComponent,
    VolumeAddkeyFormComponent,
    ZvolDeleteComponent,
    ZvolAddComponent,
    ZvolEditComponent,
    VolumeImportListComponent,
    SnapshotListComponent,
    SnapshotCloneComponent,
    SnapshotRollbackComponent,
    SnapshotAddComponent,
    ImportDiskComponent,
    DatasetPermissionsComponent,
    VMwareSnapshotFormComponent,
    VMwareSnapshotListComponent,
    StatusComponent,
    DisksListComponent,
    DiskFormComponent,
    DiskWipeComponent
  ],
  providers : [UserService, StorageService]
})
export class StorageModule {
}
