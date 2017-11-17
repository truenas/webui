import { AppCommonModule } from '../../components/common/app-common.module';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MaterialModule, MdCardModule } from '@angular/material';
import { TranslateModule } from 'ng2-translate/ng2-translate';

import {DashboardComponent} from './dashboard.component';
import {routing} from './dashboard.routing';


@NgModule({
  imports : [ 
  	CommonModule,
  	FormsModule,
  	routing, 
  	MaterialModule,
  	MdCardModule,
  	AppCommonModule,
  	TranslateModule
  ],
  declarations : [
    DashboardComponent
  ],
  providers : [
    
  ]
})
export class DashboardModule {
}
