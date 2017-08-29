import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { EntityModule } from '../../common/entity/entity.module';

import { SMBListComponent } from './smb-list/';
import { SMBFormComponent } from './smb-form/';
import { routing } from './smb.routing';

@NgModule({
  imports : [
    EntityModule, CommonModule, FormsModule,
    ReactiveFormsModule, routing
  ],
  declarations : [
    SMBListComponent,
    SMBFormComponent,
  ],
  providers : []
})
export class SMBModule {
}