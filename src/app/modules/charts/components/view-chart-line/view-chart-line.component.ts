import { Component } from '@angular/core';
import { ViewChartComponent, viewChartMetadata } from 'app/modules/charts/components/view-chart/view-chart.component';
import { ChartConfiguration } from 'app/modules/charts/components/view-chart/view-chart.component.types';

interface TimeData {
  start: number;
  end: number;
  step: number;
  legend?: string;
}

@Component({
  selector: 'viewchartline',
  template: viewChartMetadata.template,
})
export class ViewChartLineComponent extends ViewChartComponent {
  timeSeries: boolean;
  timeFormat: string;

  protected _tooltipHeight: string;
  protected _chartType: string;
  protected _timeData: TimeData;

  constructor() {
    super();
    this.chartType = 'line';
    this.timeFormat = '%m/%d/%Y';
  }

  get chartType(): string {
    return this._chartType;
  }

  set chartType(str: string) {
    if (str === 'line' || str === 'area' || str === 'spline' || str === 'area-spline' || !str) {
      this._chartType = str;
    } else {
      console.warn('chartType must be a valid line chart type (line, area, spline or area-spline)');
    }
  }

  get tooltipHeight(): string {
    return this._tooltipHeight;
  }

  set tooltipHeight(tth: string) {
    this._tooltipHeight = tth + 'px';
  }

  get timeData(): TimeData {
    return this._timeData;
  }

  set timeData(td: TimeData) {
    this._timeData = td;
  }

  protected makeTimeAxis(td: TimeData, axis?: string): any[] {
    if (!axis) { axis = 'x'; }
    const labels: any[] = [axis];
    this._data[0].forEach((item: any, index: number) => {
      const date = new Date(td.start * 1000 + index * td.step * 1000);
      labels.push(date);
    });

    return labels;
  }

  makeConfig(): ChartConfiguration {
    this.chartConfig = {
      bindto: '#' + this._chartId,
      grid: {
        x: {
          show: false,
        },
        y: {
          show: true,
        },
      },
      axis: {
        x: {
          padding: {
            left: 0,
            right: 0,
          },
          tick: {
            format: '%H:%M:%S',
            fit: true,
            culling: {
              max: 5,
            },
          },
        },
        y: {
          inner: false,
        },
      },
      data: {
        type: this.chartType,
        columns: this._data,
      },
      size: {
        // width: this.width,
        // height: this.height
      },
      subchart: {
        show: false,
        size: {
          height: 24,
        },
      },
      zoom: {
        enabled: true,
      },
      legend: {
        position: 'top',
        show: false,
      },
      tooltip: {
        grouped: true,
        contents: () => '<div style="display:none;">tooltips disabled</div>',
        format: {
          value: (value: any) => {
            if (this.units) {
              return value + this.units;
            }
            return value;
          },
        },
      },
    };

    if (this.timeSeries && this.timeData) {
      this.chartConfig.data.x = 'x';
      this.chartConfig.axis.x.type = 'timeseries';
      this.chartConfig.axis.x.tick.format = this.timeFormat;
      const xAxis = this.makeTimeAxis(this.timeData);
      this._data.unshift(xAxis);
    }

    return this.chartConfig;
  }
}
