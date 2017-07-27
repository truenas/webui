import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {DynamicFormsCoreModule} from '@ng2-dynamic-forms/core';
import {DynamicFormsBootstrapUIModule} from '@ng2-dynamic-forms/ui-bootstrap';
import {DragulaModule} from 'ng2-dragula';
import { MaterialModule, MdTableModule } from '@angular/material';

import {NgaModule} from '../../../theme/nga.module';
import {EntityModule} from '../../common/entity/entity.module';

import {DatasetFormComponent} from './datasets/dataset-form/';
import {DatasetDeleteComponent} from './datasets/dataset-delete/';
import {DiskComponent, ManagerComponent, VdevComponent} from './manager/';
// import { VolumesEditComponent } from './volumes-edit/';
import {VolumeDeleteComponent} from './volume-delete/';
import {VolumesListComponent} from './volumes-list/';
import {VolumeImportListComponent} from './import-list/';
import {routing} from './volumes.routing';
import {ZvolAddComponent} from './zvol/zvol-add/';
import {ZvolDeleteComponent} from './zvol/zvol-delete/';
import {ZvolEditComponent} from './zvol/zvol-edit/';

@NgModule({
  imports : [
    RouterModule, DragulaModule, EntityModule, DynamicFormsCoreModule.forRoot(),
    DynamicFormsBootstrapUIModule, CommonModule, FormsModule,
    ReactiveFormsModule, NgaModule, routing, MaterialModule, MdTableModule
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
    ZvolAddComponent,
    ZvolDeleteComponent,
    ZvolEditComponent,
    VolumeImportListComponent,
  ],
  providers : []
})
export class VolumesModule {
}
