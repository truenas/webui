import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ChartistModule} from 'ng-chartist';

import {NgaModule} from '../../theme/nga.module';
import { MaterialModule, MdCardModule } from '@angular/material';

import {ReportsDashboard} from './reportsdashboard.component';
import {routing} from './reportsdashboard.routing';
import {LineChart} from './lineChart/lineChart.component';
import {LineChartService} from './lineChart/lineChart.service';

@NgModule({
  imports : [ CommonModule, ChartistModule, FormsModule, NgaModule, routing, 
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
