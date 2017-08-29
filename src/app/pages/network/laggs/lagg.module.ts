import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {NetworkService} from '../../../services';
import {EntityModule} from '../../common/entity/entity.module';

import {LaggDeleteComponent} from './lagg-delete/';
import {LaggFormComponent} from './lagg-form/';
import {LaggListComponent} from './lagg-list/';
import {routing} from './lagg.routing';

@NgModule({
  imports : [
    EntityModule, CommonModule, FormsModule, ReactiveFormsModule, 
    routing
  ],
  declarations : [
    LaggListComponent,
    LaggFormComponent,
    LaggDeleteComponent,
  ],
  providers : [ NetworkService ]
})
export class LaggModule {
}
