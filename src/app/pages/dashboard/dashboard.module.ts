import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ChartistModule} from 'ng-chartist';
import { ChartsModule } from 'ng2-charts';

import {NgaModule} from '../../theme/nga.module';
import { MaterialModule, MdCardModule } from '@angular/material';

import {Dashboard} from './dashboard.component';
import {routing} from './dashboard.routing';
import {LineChart} from './lineChart/lineChart.component';
import {LineChartService} from './lineChart/lineChart.service';
import { NglineChartComponent } from './ngline-chart/ngline-chart.component';

@NgModule({
  imports : [ CommonModule, ChartistModule, ChartsModule, FormsModule, NgaModule, routing, 
  MaterialModule, MdCardModule ],
  declarations : [
    Dashboard,
    LineChart,
    NglineChartComponent
  ],
  providers : [
    LineChartService,
  ]
})
export class DashboardModule {
}
