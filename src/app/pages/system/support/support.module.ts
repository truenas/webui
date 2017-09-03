import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {EntityModule} from '../../common/entity/entity.module';

import {SupportComponent} from './support.component';
import {routing} from './support.routing';

@NgModule({
  imports : [
    EntityModule, CommonModule, FormsModule,
    ReactiveFormsModule, routing
  ],
  declarations : [
    SupportComponent
  ],
  providers : []
})
export class SupportModule {
}
