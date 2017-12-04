import { AppCommonModule } from '../../components/common/app-common.module';
import { NgModule } from '@angular/core';

import {DashboardComponent} from './dashboard.component';
import {routing} from './dashboard.routing';

@NgModule({
  imports : [
    AppCommonModule,
  	routing  	
  ],
  declarations : [
    DashboardComponent
  ],
  providers : [
    
  ]
})
export class DashboardModule {
}
