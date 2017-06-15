import { NgModule }      from '@angular/core';
import { CommonModule }  from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgaModule } from '../../../theme/nga.module';

import { EntityModule } from '../../common/entity/entity.module';
import { routing }       from './vlan.routing';

import { VlanListComponent } from './vlan-list/';
import { VlanFormComponent } from './vlan-form/';
import { VlanDeleteComponent } from './vlan-delete/';

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
    VlanListComponent,
    VlanFormComponent,
    VlanDeleteComponent,
  ],
  providers: [
    NetworkService
  ]
})
export class VlanModule {}
