import { AppCommonModule } from '../../components/common/app-common.module';
import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import { MaterialModule, MdCardModule } from '@angular/material';

import {ReportsDashboardComponent} from './reportsdashboard.component';
import {routing} from './reportsdashboard.routing';
import {LineChartService} from '../../components/common/lineChart/lineChart.service';

@NgModule({
  imports : [ CommonModule, FormsModule, routing, 
  MaterialModule, MdCardModule, AppCommonModule ],
  declarations : [
    ReportsDashboardComponent
  ],
  providers : [
    
  ]
})
export class ReportsDashboardModule {
}
