import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { MaterialModule, MdCardModule } from '@angular/material';

import {EntityModule} from '../../common/entity/entity.module';

import {SnapshotAddComponent} from './snapshot-add/';
import {SnapshotCloneComponent} from './snapshot-clone/';
import {SnapshotDeleteComponent} from './snapshot-delete/';
import {SnapshotListComponent} from './snapshot-list/';
import {SnapshotRollbackComponent} from './snapshot-rollback/';
import {routing} from './snapshots.routing';

@NgModule({
  imports : [
    EntityModule, CommonModule, FormsModule,
    ReactiveFormsModule, routing, 
    MaterialModule, MdCardModule
  ],
  declarations : [
    SnapshotListComponent, 
    SnapshotDeleteComponent, 
    SnapshotCloneComponent,
    SnapshotRollbackComponent,
    SnapshotAddComponent
  ],
  providers : []
})
export class SnapshotsModule {
}
