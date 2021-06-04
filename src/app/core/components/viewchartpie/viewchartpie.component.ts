import { Component, OnInit } from '@angular/core';

import { ViewChartMetadata } from 'app/core/components/viewchart/viewchart.component';
import { ViewChartDonutComponent } from 'app/core/components/viewchartdonut/viewchartdonut.component';

@Component({
  selector: 'viewchartpie',
  template: ViewChartMetadata.template,
  // templateUrl: './viewchartpie.component.html',
})
export class ViewChartPieComponent extends ViewChartDonutComponent implements OnInit {
  chartType = 'pie';

  ngOnInit(): void {
  }
}
