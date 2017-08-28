import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgUploaderModule } from 'ngx-uploader';

import { FnCommonModule } from '../common/common.module';
import { EntityModule } from '../common/entity/entity.module';

import { AdvancedComponent } from './advanced/';
import { MaterialModule } from '@angular/material';
import { routing } from './system.routing';

@NgModule({
  imports: [
    EntityModule, FnCommonModule, CommonModule, FormsModule,
    ReactiveFormsModule, NgUploaderModule, routing,
    MaterialModule
  ],
  declarations: [
    AdvancedComponent,
  ],
  providers: []
})
export class SystemModule {}
