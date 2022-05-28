import { Component, OnInit } from '@angular/core';
import { ViewChartComponent } from 'app/modules/charts/components/view-chart/view-chart.component';

@Component({
  selector: 'ix-view-chart-donut',
  templateUrl: './view-chart-donut.component.html',
})
export class ViewChartDonutComponent extends ViewChartComponent implements OnInit {
  title = '';
  _chartType = 'donut';
  legendPosition = 'right'; // Valid positions are top or right

  ngOnInit(): void {
    this.showLegendValues = true;
  }

  makeConfig(): any {
    this.chartConfig = {
      bindto: '#' + this._chartId,
      data: {
        columns: this._data,
        type: this.chartType,
      },
      donut: {
        title: this.title,
        width: 15,
        label: {
          show: false,
        },
      },
      size: {
        width: this.width,
        height: this.height,
      },
      tooltip: {
        format: {
          value: (value: string) => {
            if (this.units) {
              return value + this.units;
            }
            return value;
          },
        },
      },
    };
    this.tooltipOptions = {
      show: false,
    };
    return this.chartConfig;
  }
}
