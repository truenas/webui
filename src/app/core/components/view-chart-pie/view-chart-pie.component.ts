import { Component, OnInit } from '@angular/core';
import { ViewChartDonutComponent } from 'app/core/components/view-chart-donut/view-chart-donut.component';
import { ViewChartMetadata } from 'app/core/components/view-chart/view-chart.component';

@Component({
  selector: 'viewchartpie',
  template: ViewChartMetadata.template,
  // templateUrl: './viewchartpie.component.html',
})
export class ViewChartPieComponent extends ViewChartDonutComponent implements OnInit {
  _chartType = 'pie';

  // eslint-disable-next-line @angular-eslint/no-empty-lifecycle-method
  ngOnInit(): void {
  }
}
