import { NgModule }      from '@angular/core';
import { CommonModule }  from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgaModule } from '../../../theme/nga.module';

import { EntityModule } from '../../common/entity/entity.module';
import { routing }       from './interfaces.routing';

import { InterfacesListComponent } from './interfaces-list/';
import { InterfacesFormComponent } from './interfaces-form/';
import { InterfacesDeleteComponent } from './interfaces-delete/';

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
    InterfacesListComponent,
    InterfacesFormComponent,
    InterfacesDeleteComponent,
  ],
  providers: [
    NetworkService
  ]
})
export class InterfacesModule {}
