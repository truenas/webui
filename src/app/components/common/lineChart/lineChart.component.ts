import 'style-loader!./lineChart.scss';

import {Component, Input, OnInit, AfterViewInit} from '@angular/core';
import * as ChartistLegend from 'chartist-plugin-legend';
import {UUID} from 'angular2-uuid';
import * as c3 from 'c3';

import {LineChartService, HandleDataFunc, LineChartData} from './lineChart.service';


export interface ChartFormatter {
  format (value, ratio, id);
}


@Component({selector: 'line-chart', templateUrl: './lineChart.html'})
export class LineChartComponent implements OnInit, AfterViewInit, HandleDataFunc {

  @Input() dataList: any[];
  @Input() series: any;
  @Input() legends: any[];
  @Input() type: string;
  @Input() divideBy: number;
  @Input() chartFormatter: ChartFormatter;
  data: LineChartData = {
    labels: [],
    series: [],
  };

  controlUid: string;


  constructor(private _lineChartService: LineChartService) {}

  handleDataFunc(linechartData: LineChartData) {

    this.data.labels.splice(0, this.data.labels.length);
    this.data.series.splice(0, this.data.series.length);

    linechartData.labels.forEach((label) => {this.data.labels.push(new Date(label))});
    linechartData.series.forEach((dataSeriesArray) => {

      if (typeof (this.divideBy) !== 'undefined') {
        const newArray = new Array();
        dataSeriesArray.forEach((numberVal) => {

          if (numberVal > 0) {
            newArray.push(numberVal / this.divideBy);
          } else {
            newArray.push(numberVal);
          }
        });

        dataSeriesArray = newArray;
      }
      this.data.series.push(dataSeriesArray);
    });

    const columns: any[][] = [];

    // xColumn
    const xValues: any[] = [];
    xValues.push('xValues');
    this.data.labels.forEach((label) => {
      xValues.push(label);
    });

    columns.push(xValues);

    // For C3.. Put the name of the series as the first element of each series array
    for (let i = 0; i < this.legends.length && this.data.series.length; ++i) {
      const legend: string = this.legends[i];
      const series: any[] = this.data.series[i];
      series.unshift(legend);
      columns.push(series);
    }

    const chart = c3.generate({
      bindto: '#' + this.controlUid,
      data: {
        columns: columns,
        x: 'xValues',
        //xFormat: '%H:%M',
        type: 'area-spline'
      },
      axis: {
        x: {
          type: 'timeseries',
          tick: {
            format: '%H:%M:%S',
            fit: true//,
            //values: ['01:10', '03:10', '06:10']
          }
        }
      }

    });

  }

  private setupPiechart() {

    const chart = c3.generate({
      bindto: '#' + this.controlUid,
      data: {
        columns: this.series,
        type: 'pie'
      },
      pie: {
        label: {
            format: this.chartFormatter.format
        }
    }
    });

  }

  ngOnInit() {

    this.controlUid = "chart_" + UUID.UUID();
  }

  ngAfterViewInit() {
    if (this.type === 'Pie') {
      this.setupPiechart();

    } else {
      if (this.dataList.length > 0) {
        this._lineChartService.getData(this, this.dataList);
      }
    }


  }

}
