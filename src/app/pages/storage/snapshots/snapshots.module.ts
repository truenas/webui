import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {DynamicFormsCoreModule} from '@ng2-dynamic-forms/core';
import {DynamicFormsBootstrapUIModule} from '@ng2-dynamic-forms/ui-bootstrap';

import {NgaModule} from '../../../theme/nga.module';
import {EntityModule} from '../../common/entity/entity.module';

import {SnapshotAddComponent} from './snapshot-add/';
import {SnapshotCloneComponent} from './snapshot-clone/';
import {SnapshotDeleteComponent} from './snapshot-delete/';
import {SnapshotListComponent} from './snapshot-list/';
import {SnapshotRollbackComponent} from './snapshot-rollback/';
import {routing} from './snapshots.routing';

@NgModule({
  imports : [
    EntityModule, DynamicFormsCoreModule.forRoot(),
    DynamicFormsBootstrapUIModule, CommonModule, FormsModule,
    ReactiveFormsModule, NgaModule, routing
  ],
  declarations : [
    SnapshotListComponent, SnapshotDeleteComponent, SnapshotCloneComponent,
    SnapshotRollbackComponent, SnapshotAddComponent
  ],
  providers : []
})
export class SnapshotsModule {
}
