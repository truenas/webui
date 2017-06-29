import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ChartistModule} from 'ng-chartist';

import {NgaModule} from '../../theme/nga.module';

import {Dashboard} from './dashboard.component';
import {routing} from './dashboard.routing';
import {LineChart} from './lineChart/lineChart.component';
import {LineChartService} from './lineChart/lineChart.service';

@NgModule({
  imports : [ CommonModule, ChartistModule, FormsModule, NgaModule, routing ],
  declarations : [
    Dashboard,
    LineChart,
  ],
  providers : [
    LineChartService,
  ]
})
export class DashboardModule {
}
