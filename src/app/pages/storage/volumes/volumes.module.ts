import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {DragulaModule} from 'ng2-dragula';
import { MaterialModule, MdTableModule, MdCardModule } from '@angular/material';

import {EntityModule} from '../../common/entity/entity.module';

import {DatasetFormComponent} from './datasets/dataset-form/';
import {DatasetDeleteComponent} from './datasets/dataset-delete/';
import {DiskComponent, ManagerComponent, VdevComponent} from './manager/';
// import { VolumesEditComponent } from './volumes-edit/';
import {VolumeDeleteComponent} from './volume-delete/';
import {VolumesListComponent} from './volumes-list/';
import {VolumeImportListComponent} from './import-list/';
import {routing} from './volumes.routing';
import {ZvolDeleteComponent} from './zvol/zvol-delete/';
import {ZvolAddComponent} from './zvol/zvol-add'
import {ZvolEditComponent} from './zvol/zvol-edit/';

@NgModule({
  imports : [
    RouterModule, DragulaModule, EntityModule, CommonModule, FormsModule,
    ReactiveFormsModule, routing, MaterialModule, MdTableModule, MdCardModule
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
  ],
  providers : []
})
export class VolumesModule {
}
