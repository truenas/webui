import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgUploaderModule} from 'ngx-uploader';

import {EntityModule} from '../common/entity/entity.module';

import {ConfigurationComponent} from './configuration/';
import {routing} from './network.routing';

@NgModule({
  imports : [
    EntityModule, CommonModule, FormsModule,
    ReactiveFormsModule, NgUploaderModule, routing
  ],
  declarations : [
    ConfigurationComponent,
  ],
  providers : []
})
export class NetworkModule {
}
