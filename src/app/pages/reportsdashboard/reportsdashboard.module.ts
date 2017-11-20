import { AppCommonModule } from '../../components/common/app-common.module';
import { NgModule } from '@angular/core';

import { ReportsDashboardComponent } from './reportsdashboard.component';
import { routing } from './reportsdashboard.routing';

@NgModule({
  imports : [  
  	AppCommonModule,
  	routing, 
  ],
  declarations : [
    ReportsDashboardComponent
  ],
  providers : [
    
  ]
})
export class ReportsDashboardModule {
}
