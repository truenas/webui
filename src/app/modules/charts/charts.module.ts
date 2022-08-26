import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ViewChartAreaComponent } from 'app/modules/charts/components/view-chart-area/view-chart-area.component';
import { ViewChartGaugeComponent } from 'app/modules/charts/components/view-chart-gauge/view-chart-gauge.component';

@NgModule({
  imports: [
    CommonModule,
  ],
  declarations: [
    ViewChartAreaComponent,
    ViewChartGaugeComponent,
  ],
  exports: [
    ViewChartAreaComponent,
    ViewChartGaugeComponent,
  ],
})
export class ChartsModule {}
