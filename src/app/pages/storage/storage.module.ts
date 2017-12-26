import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DragulaModule } from 'ng2-dragula';
import { MaterialModule, MdTableModule, MdCardModule, MdGridListModule } from '@angular/material';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';

import { EntityModule } from '../common/entity/entity.module';
import { UserService } from '../../services/user.service';
import { StorageService } from '../../services/storage.service';

import { SnapshotAddComponent } from './snapshots/snapshot-add/';
import { SnapshotCloneComponent } from './snapshots/snapshot-clone/';
import { SnapshotListComponent } from './snapshots/snapshot-list/';
import { SnapshotRollbackComponent } from './snapshots/snapshot-rollback/';
import { DatasetFormComponent } from './pools/datasets/dataset-form/';
import { DatasetDeleteComponent } from './pools/datasets/dataset-delete/';
import { DatasetPermissionsComponent } from './pools/datasets/dataset-permissions/'
import { StatusComponent } from './pools/status/status.component';

import { DiskComponent, ManagerComponent, VdevComponent } from './pools/manager/';
// import { VolumesEditComponent } from './volumes/volumes-edit/';
import { PoolDeleteComponent } from './pools/pool-delete/';
import { PoolsListComponent } from './pools/pools-list/';
import { PoolImportListComponent } from './pools/import-list/';
import { routing } from './storage.routing';
import { ZvolDeleteComponent } from './pools/zvol/zvol-delete/';
import { ZvolAddComponent } from './pools/zvol/zvol-add'
import { ZvolEditComponent } from './pools/zvol/zvol-edit/';
import { VMwareSnapshotFormComponent } from './VMware-snapshot/VMware-snapshot';
import { VMwareSnapshotListComponent } from './VMware-snapshot/VMware-snapshot-list';
import { DisksListComponent } from './disks/disks-list/';
import { DiskFormComponent } from './disks/disk-form/';
import { DiskWipeComponent } from './disks/disk-wipe/disk-wipe.component';


@NgModule({
  imports : [
    RouterModule, DragulaModule, EntityModule, CommonModule, FormsModule,
    ReactiveFormsModule, routing, MaterialModule, MdTableModule, MdCardModule, MdGridListModule,
    NgxDatatableModule
  ],
  declarations : [
    PoolsListComponent,
    ManagerComponent,
    DiskComponent,
    VdevComponent,
    DatasetFormComponent,
    DatasetDeleteComponent,
    // VolumesEditComponent,
    PoolDeleteComponent,
    ZvolDeleteComponent,
    ZvolAddComponent,
    ZvolEditComponent,
    PoolImportListComponent,
    SnapshotListComponent,
    SnapshotCloneComponent,
    SnapshotRollbackComponent,
    SnapshotAddComponent,
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
