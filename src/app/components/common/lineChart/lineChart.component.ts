import 'style-loader!./lineChart.scss';

import {Component, Input, OnInit} from '@angular/core';
import * as ChartistLegend from 'chartist-plugin-legend';
import filesize from 'filesize';
import {UUID} from 'angular2-uuid';
import * as c3 from 'c3';

import {LineChartService, HandleDataFunc, LineChartData} from './lineChart.service';




@Component({selector: 'line-chart', templateUrl: './lineChart.html'})
export class LineChartComponent implements OnInit, HandleDataFunc {

  @Input() dataList: any[];
  @Input() series: any;
  @Input() legends: any[];
  @Input() type: string;
  @Input() divideBy: number;

  data: LineChartData = {
    labels: [],
    series: [],
  };

  controlUid: string;

  pieChartOptions: any =  {
      showPoint: false,
      showArea: true,
      fullWidth: true,
      fillHoles: true,
      showLine: true,
      plugins: []
    };
  ;
  responsiveOptions = {};

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
    for( let i = 0; i < this.legends.length && this.data.series.length; ++ i ) {
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
    this.pieChartOptions.labelInterpolationFnc = function(value, index) {
      // FIXME, workaround to work with just size pie
      return filesize(value, {standard: "iec"});
    }

    if (this.series) {
      this.series.forEach((i) => {this.data.series.push(i);});
    }

  }

  ngOnInit() {

    this.controlUid = "chart_" + UUID.UUID();

    if (this.type === 'Pie') {
      this.setupPiechart();

    } else {
      if (this.dataList.length > 0) {
        this._lineChartService.getData(this, this.dataList);
      }
    }


  }

}
