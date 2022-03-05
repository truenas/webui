import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ViewChartAreaComponent } from 'app/modules/charts/components/view-chart-area/view-chart-area.component';
import { ViewChartBarComponent } from 'app/modules/charts/components/view-chart-bar/view-chart-bar.component';
import { ViewChartDonutComponent } from 'app/modules/charts/components/view-chart-donut/view-chart-donut.component';
import { ViewChartGaugeComponent } from 'app/modules/charts/components/view-chart-gauge/view-chart-gauge.component';
import { ViewChartLineComponent } from 'app/modules/charts/components/view-chart-line/view-chart-line.component';
import { ViewChartPieComponent } from 'app/modules/charts/components/view-chart-pie/view-chart-pie.component';
import { ViewChartComponent } from 'app/modules/charts/components/view-chart/view-chart.component';

@NgModule({
  imports: [
    CommonModule,
  ],
  declarations: [
    ViewChartComponent,
    ViewChartAreaComponent,
    ViewChartBarComponent,
    ViewChartDonutComponent,
    ViewChartGaugeComponent,
    ViewChartLineComponent,
    ViewChartPieComponent,
  ],
  exports: [
    ViewChartComponent,
    ViewChartAreaComponent,
    ViewChartBarComponent,
    ViewChartDonutComponent,
    ViewChartGaugeComponent,
    ViewChartLineComponent,
    ViewChartPieComponent,
  ],
})
export class ChartsModule {}
