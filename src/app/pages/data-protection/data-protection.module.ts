import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import {EntityModule} from '../common/entity/entity.module';
import { routing } from './data-protection.routing';


import { DataProtectionComingsoonComponent } from './data-protection-comingsoon/data-protection-comingsoon.component';


 @NgModule({
  imports: [
    CommonModule, EntityModule, routing
  ],
  declarations: [
    DataProtectionComingsoonComponent
  ],
  providers: []
})
export class DataProtectionModule { };