import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {NgaModule} from '../../../theme/nga.module';
import {EntityModule} from '../../common/entity/entity.module';

import {SMBFormComponent} from './smb-form/';
import {SMBDeleteComponent} from './smb-delete/';
import {SMBListComponent} from './smb-list/';
import {routing} from './smb.routing';

@NgModule({
  imports : [
    EntityModule, CommonModule, FormsModule,
    ReactiveFormsModule, NgaModule, routing
  ],
  declarations : [
    SMBListComponent,
    SMBFormComponent,
    SMBDeleteComponent,
  ],
  providers : []
})
export class SMBModule {
}
