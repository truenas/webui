import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {NetworkService} from '../../../services';
import {NgaModule} from '../../../theme/nga.module';
import {EntityModule} from '../../common/entity/entity.module';

import {StaticRouteDeleteComponent} from './staticroute-delete/';
import {StaticRouteFormComponent} from './staticroute-form/';
import {StaticRouteListComponent} from './staticroute-list/';
import {routing} from './staticroute.routing';

@NgModule({
  imports : [
    EntityModule, CommonModule, FormsModule, ReactiveFormsModule, NgaModule,
    routing
  ],
  declarations : [
    StaticRouteListComponent,
    StaticRouteFormComponent,
    StaticRouteDeleteComponent,
  ],
  providers : [ NetworkService ]
})
export class StaticRouteModule {
}
