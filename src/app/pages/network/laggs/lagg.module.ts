import { NgModule }      from '@angular/core';
import { CommonModule }  from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgaModule } from '../../../theme/nga.module';

import { EntityModule } from '../../common/entity/entity.module';
import { routing }       from './lagg.routing';

import { LaggListComponent } from './lagg-list/';
import { LaggFormComponent } from './lagg-form/';
import { LaggDeleteComponent } from './lagg-delete/';

import { NetworkService } from '../../../services';

@NgModule({
  imports: [
    EntityModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgaModule,
    routing
  ],
  declarations: [
    LaggListComponent,
    LaggFormComponent,
    LaggDeleteComponent,
  ],
  providers: [
    NetworkService
  ]
})
export class LaggModule {}
