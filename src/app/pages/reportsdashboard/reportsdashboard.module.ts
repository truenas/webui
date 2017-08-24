import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ChartistModule} from 'ng-chartist';

import { MaterialModule, MdCardModule } from '@angular/material';

import {ReportsDashboard} from './reportsdashboard.component';
import {routing} from './reportsdashboard.routing';
import {LineChartService} from './lineChart/lineChart.service';
import {LineChart} from './lineChart/lineChart.component';

@NgModule({
  imports : [ CommonModule, ChartistModule, FormsModule, routing, 
  MaterialModule, MdCardModule ],
  declarations : [
    ReportsDashboard,
    LineChart
  ],
  providers : [
    LineChartService
  ]
})
export class ReportsDashboardModule {
}
