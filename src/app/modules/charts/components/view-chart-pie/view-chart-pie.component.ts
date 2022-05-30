import { Component, OnInit } from '@angular/core';
import { ViewChartDonutComponent } from 'app/modules/charts/components/view-chart-donut/view-chart-donut.component';
import { viewChartMetadata } from 'app/modules/charts/components/view-chart/view-chart.component';

@Component({
  template: viewChartMetadata.template,
})
export class ViewChartPieComponent extends ViewChartDonutComponent implements OnInit {
  _chartType = 'pie';

  // eslint-disable-next-line @angular-eslint/no-empty-lifecycle-method
  ngOnInit(): void {
  }
}
