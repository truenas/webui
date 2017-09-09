import { AppCommonModule } from '../../components/common/app-common.module';
import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';

import { MaterialModule, MdCardModule } from '@angular/material';

import {DashboardComponent} from './dashboard.component';
import {routing} from './dashboard.routing';


@NgModule({
  imports : [ CommonModule, FormsModule,  routing, 
  MaterialModule, MdCardModule, AppCommonModule ],
  declarations : [
    DashboardComponent
  ],
  providers : [
    
  ]
})
export class DashboardModule {
}
