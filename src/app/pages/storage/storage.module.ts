import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {DragulaModule} from 'ng2-dragula';
import { MaterialModule, MdTableModule, MdCardModule } from '@angular/material';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';

import {EntityModule} from '../common/entity/entity.module';
import { UserService } from '../../services/user.service';
import { StorageService } from '../../services/storage.service';

import {SnapshotAddComponent} from './snapshots/snapshot-add/';
import {SnapshotEditComponent} from './snapshots/snapshot-edit/';
import {SnapshotCloneComponent} from './snapshots/snapshot-clone/';
import {SnapshotListComponent} from './snapshots/snapshot-list/';
import {SnapshotRollbackComponent} from './snapshots/snapshot-rollback/';
import {DatasetFormComponent} from './volumes/datasets/dataset-form/';
import {DatasetDeleteComponent} from './volumes/datasets/dataset-delete/';
import {DatasetPermissionsComponent} from './volumes/datasets/dataset-permissions/'

import {DiskComponent, ManagerComponent, VdevComponent} from './volumes/manager/';
// import { VolumesEditComponent } from './volumes/volumes-edit/';
import {VolumeDeleteComponent} from './volumes/volume-delete/';
import {VolumesListComponent} from './volumes/volumes-list/';
import {VolumeImportListComponent} from './volumes/import-list/';
import {routing} from './storage.routing';
import {ZvolDeleteComponent} from './volumes/zvol/zvol-delete/';
import {ZvolAddComponent} from './volumes/zvol/zvol-add'
import {ZvolEditComponent} from './volumes/zvol/zvol-edit/';
import {VMwareSnapshotFormComponent} from './VMware-snapshot/VMware-snapshot';
import {VMwareSnapshotListComponent} from './VMware-snapshot/VMware-snapshot-list';

@NgModule({
  imports : [
    RouterModule, DragulaModule, EntityModule, CommonModule, FormsModule,
    ReactiveFormsModule, routing, MaterialModule, MdTableModule, MdCardModule,
    NgxDatatableModule
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
    ZvolDeleteComponent,
    ZvolAddComponent,
    ZvolEditComponent,
    VolumeImportListComponent,
    SnapshotListComponent, 
    SnapshotCloneComponent,
    SnapshotRollbackComponent,
    SnapshotAddComponent,
    SnapshotEditComponent,
    DatasetPermissionsComponent,
    VMwareSnapshotFormComponent,
    VMwareSnapshotListComponent
  ],
  providers : [UserService, StorageService]
})
export class StorageModule {
}
