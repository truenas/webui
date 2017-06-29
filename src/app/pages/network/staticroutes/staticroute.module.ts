import { NgModule }      from '@angular/core';
import { CommonModule }  from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgaModule } from '../../../theme/nga.module';

import { EntityModule } from '../../common/entity/entity.module';
import { routing }       from './staticroute.routing';

import { StaticRouteListComponent } from './staticroute-list/';
import { StaticRouteFormComponent } from './staticroute-form/';
import { StaticRouteDeleteComponent } from './staticroute-delete/';

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
    StaticRouteListComponent,
    StaticRouteFormComponent,
    StaticRouteDeleteComponent,
  ],
  providers: [
    NetworkService
  ]
})
export class StaticRouteModule {}
