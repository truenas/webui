import 'style-loader!./lineChart.scss';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { CoreService, CoreEvent } from 'app/core/services/core.service';

import {Component, Input, OnInit, AfterViewInit, OnDestroy} from '@angular/core';
import * as ChartistLegend from 'chartist-plugin-legend';
import {UUID} from 'angular2-uuid';
import * as c3 from 'c3';

import { LineChartService, HandleDataFunc, LineChartData,LineChartMetadata, DataListItem } from './lineChart.service';


export interface ChartFormatter {
  format (value, ratio, id);
}

@Component({
  selector: 'line-chart', 
  template: `<div id="{{controlUid}}"></div>`
})
export class LineChartComponent implements OnInit, AfterViewInit, OnDestroy, HandleDataFunc {

  @Input() dataList: DataListItem[];

  /**   First element is Name of the Field a string
   *    Followed by the other elements being a number.
   *    This fits in with how C3 charts work.
   *
   *     [ ["nameOfField_1", number, number, number, number],
     *       ["nameOfField_2", number, number, number, number]
     *     ]
   */
  @Input() series: any[][];
  @Input() legends: string[]; 
  @Input() type: string;
  @Input() divideBy: number;
  @Input() chartFormatter: ChartFormatter;
  @Input() minY?: number = 0;
  @Input() maxY?: number = 100;
  @Input() labelY?: string = 'Label Y';

  public chart:any;
  public showLegendValues: boolean = false;
  public legendEvents: BehaviorSubject<any>;
  data: LineChartData = {
    labels: [],
    series: [],
    //meta: {}
  };
  colorPattern = ["#2196f3", "#009688", "#ffc107", "#9c27b0", "#607d8b", "#00bcd4", "#8bc34a", "#ffeb3b", "#e91e63", "#3f51b5"];


  controlUid: string;


  constructor(private core:CoreService, private _lineChartService: LineChartService) {
    this.legendEvents = new BehaviorSubject(false);
  }

  handleDataFunc(linechartData: LineChartData) {
    //console.log(linechartData)

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
      let series: any[] = this.data.series[i];
      if( typeof(series) !== 'undefined' && series.length > 0 ) {
        series.unshift(legend);
      } else {
        series = [legend];
      }
      columns.push(series);
    }


    this.chart = c3.generate({
      bindto: '#' + this.controlUid,
      /*color: {
        pattern: this.colorPattern
      },*/
      data: {
        columns: columns,
        colors: this.createColorObject(),
        x: 'xValues',
        //xFormat: '%H:%M',
        type: 'line',
        onmouseout: (d) => {
          this.showLegendValues = false;
        }
      },
      axis: {
        x: {
          type: 'timeseries',
          tick: {
            format: '%H:%M:%S',
            fit: true//,
            //values: ['01:10', '03:10', '06:10']
            }
        },
        y:{
          tick: {
            format: (y) => { return y + linechartData.meta.units}
          },
          label: {
            text:linechartData.meta. labelY,
            position: 'outer-middle',
          }
          //default: [this.minY,this.maxY],
          /*min: this.minY,
          max: this.maxY*/
        }
      },
      grid:{
        x:{
          show: true
        },
        y:{
          show: true
        }
      },
      subchart: {
        show: true
      },
      legend: {
        show:false
      },
      zoom: {
        enabled: false
      },
      tooltip: {
        show: true,
        contents: (raw, defaultTitleFormat, defaultValueFormat, color) => {
          if(!this.showLegendValues){
            this.showLegendValues = true;
          }

          if(raw.value == Number(0)){
            raw.value == raw.value.toString()
          }
          
          this.legendEvents.next(raw);
          return '<div style="display:none">' + raw[0].x + '</div>';
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

  private processThemeColors(theme):string[]{
    let colors: string[] = [];
    theme.accentColors.map((color) => {
      colors.push(theme[color]);
    }); 
    return colors;
  }

  private createColorObject(){
    let obj = {};
    this.legends.forEach((item, index)=>{
      obj[item] = this.colorPattern[index]
    })
    return obj;
  }

  public fetchData(timeframe:string){
    // This is the time portion of the API call. 
    this._lineChartService.getData(this, this.dataList, timeframe);
  }

  ngOnInit() {
    this.core.register({ observerClass:this, eventName:"ThemeData" }).subscribe((evt:CoreEvent)=>{ 
      this.colorPattern = this.processThemeColors(evt.data);
      if(this.chart){ 
        this.chart.data.colors(this.createColorObject())
      }
    });

    this.core.register({ observerClass:this, eventName:"ThemeChanged" }).subscribe((evt:CoreEvent)=>{ 
      this.colorPattern = this.processThemeColors(evt.data);
      if(this.chart){ 
        this.chart.data.colors(this.createColorObject())
      }
    });

    this.core.emit({name:"ThemeDataRequest"});
    this.controlUid = "chart_" + UUID.UUID();
  }

  ngAfterViewInit() {
    if (this.type === 'Pie') {
      this.setupPiechart();
    } else {
      if (this.dataList.length > 0) {
        this.fetchData('now-10m');
      }
    }
  }

  ngOnDestroy(){
    this.core.unregister({observerClass:this});
  }

}
