import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {NetworkService} from '../../../services';
import {EntityModule} from '../../common/entity/entity.module';

import {InterfacesDeleteComponent} from './interfaces-delete/';
import {InterfacesFormComponent} from './interfaces-form/';
import {InterfacesListComponent} from './interfaces-list/';
import {routing} from './interfaces.routing';

@NgModule({
  imports : [
    EntityModule, CommonModule, FormsModule, ReactiveFormsModule, 
    routing
  ],
  declarations : [
    InterfacesListComponent,
    InterfacesFormComponent,
    InterfacesDeleteComponent,
  ],
  providers : [ NetworkService ]
})
export class InterfacesModule {
}
