import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {EntityModule} from '../../common/entity/entity.module';

import {BootEnvironmentCloneComponent} from './bootenv-clone/';
import {BootEnvironmentDeleteComponent} from './bootenv-delete/';
import {BootEnvironmentListComponent} from './bootenv-list/';
import {routing} from './bootenv.routing';

@NgModule({
  imports : [
    EntityModule, CommonModule, FormsModule,
    ReactiveFormsModule, routing
  ],
  declarations : [
    BootEnvironmentListComponent, BootEnvironmentDeleteComponent,
    BootEnvironmentCloneComponent
  ],
  providers : []
})
export class BootEnvironmentsModule {
}
