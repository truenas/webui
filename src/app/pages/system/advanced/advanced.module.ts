import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgUploaderModule} from 'ngx-uploader';
import { MaterialModule } from '@angular/material';

import {EntityModule} from '../../common/entity/entity.module';
import { AdvancedComponent } from './advanced.component';
import { routing } from './advanced.routing';

@NgModule({
  imports : [
    EntityModule, CommonModule, FormsModule,
    ReactiveFormsModule, NgUploaderModule, routing,
    MaterialModule
  ],
  declarations : [
  	AdvancedComponent
  ],
  providers : []
})
export class SystemAdvancedModule {
}