import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {NetworkService} from '../../../services';
import {NgaModule} from '../../../theme/nga.module';
import {EntityModule} from '../../common/entity/entity.module';

import {VlanDeleteComponent} from './vlan-delete/';
import {VlanFormComponent} from './vlan-form/';
import {VlanListComponent} from './vlan-list/';
import {routing} from './vlan.routing';

@NgModule({
  imports : [
    EntityModule, CommonModule, FormsModule, ReactiveFormsModule, NgaModule,
    routing
  ],
  declarations : [
    VlanListComponent,
    VlanFormComponent,
    VlanDeleteComponent,
  ],
  providers : [ NetworkService ]
})
export class VlanModule {
}
