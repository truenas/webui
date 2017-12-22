import { AppCommonModule } from '../../components/common/app-common.module';
import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';

import { MaterialModule, MdCardModule } from '@angular/material';
import { EntityModule } from '../common/entity/entity.module';

import {DashboardComponent} from './dashboard.component';
import {routing} from './dashboard.routing';


@NgModule({
  imports : [ CommonModule, FormsModule,  routing, 
  MaterialModule, MdCardModule, AppCommonModule , EntityModule],
  declarations : [
    DashboardComponent
  ],
  providers : [
    
  ]
})
export class DashboardModule {
}
