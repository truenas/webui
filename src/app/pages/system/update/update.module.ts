import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgUploaderModule } from 'ngx-uploader';

import { EntityModule } from '../../common/entity/entity.module';

import { MaterialModule } from '@angular/material';
import { routing } from './update.routing';
import { UpdateComponent } from '../update/';
@NgModule({
  imports : [
     EntityModule, CommonModule, FormsModule, MaterialModule,
    ReactiveFormsModule, NgUploaderModule, routing,
  ],
  declarations : [
  	UpdateComponent
  ],
  providers : []
})
export class UpdateModule {
}