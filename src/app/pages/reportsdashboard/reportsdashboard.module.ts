import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ChartistModule} from 'ng-chartist';

import { MaterialModule, MdCardModule } from '@angular/material';

import {ReportsDashboardComponent} from './reportsdashboard.component';
import {routing} from './reportsdashboard.routing';
import {LineChartService} from './lineChart/lineChart.service';
import {LineChartComponent} from './lineChart/lineChart.component';

@NgModule({
  imports : [ CommonModule, ChartistModule, FormsModule, routing, 
  MaterialModule, MdCardModule ],
  declarations : [
    ReportsDashboardComponent,
    LineChartComponent
  ],
  providers : [
    LineChartService
  ]
})
export class ReportsDashboardModule {
}
