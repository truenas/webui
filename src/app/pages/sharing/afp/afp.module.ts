import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {NgaModule} from '../../../theme/nga.module';
import {EntityModule} from '../../common/entity/entity.module';

import {AFPFormComponent} from './afp-form/';
import {AFPDeleteComponent} from './afp-delete/';
import {AFPListComponent} from './afp-list/';
import {routing} from './afp.routing';

@NgModule({
  imports : [
    EntityModule, CommonModule, FormsModule,
    ReactiveFormsModule, NgaModule, routing
  ],
  declarations : [
    AFPListComponent,
    AFPFormComponent,
    AFPDeleteComponent,
  ],
  providers : []
})
export class AFPModule {
}
