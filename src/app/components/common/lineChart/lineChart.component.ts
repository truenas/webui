import 'style-loader!./lineChart.scss';
import { BehaviorSubject } from 'rxjs';
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
  public units: string = '';
  public showLegendValues: boolean = false;
  public legendEvents: BehaviorSubject<any>;
  public legendLabels: BehaviorSubject<any>;
  data: LineChartData = {
    labels: [],
    series: [],
    //meta: {}
  };
  colorPattern = ["#2196f3", "#009688", "#ffc107", "#9c27b0", "#607d8b", "#00bcd4", "#8bc34a", "#ffeb3b", "#e91e63", "#3f51b5"];
  timeFormat: string = "%H:%M";
  culling:number = 6;
  controlUid: string;


  constructor(private core:CoreService, private _lineChartService: LineChartService) {
    this.legendEvents = new BehaviorSubject(false);
    this.legendLabels = new BehaviorSubject([]);
  }

  handleDataFunc(linechartData: LineChartData) {

    this.data.labels.splice(0, this.data.labels.length);
    this.data.series.splice(0, this.data.series.length);
    if(linechartData.meta){
      this.units = linechartData.meta.units;
    }

    linechartData.labels.forEach((label) => {this.data.labels.push(new Date(label))});
    linechartData.series.forEach((dataSeriesArray) => {
    
    const newArray = [];
    if(!linechartData.meta)console.log(linechartData);
      if (typeof (this.divideBy) !== 'undefined' || linechartData.meta.conversion) {
        dataSeriesArray.forEach((numberVal) => {
          if(linechartData.meta.conversion){
            newArray.push(this.convertTo(numberVal, linechartData.meta.conversion));
          } else if (numberVal > 0) {
            newArray.push((numberVal / this.divideBy).toFixed(2));
          } else {
            newArray.push(numberVal);
          }
        });
        
        dataSeriesArray = newArray;
      } else { 
        dataSeriesArray.forEach((numberVal) => {
          if(numberVal > 0){
            newArray.push(numberVal.toFixed(2));
          } else {
            newArray.push(numberVal);
          }
        });
        dataSeriesArray = newArray;
      }
  
      this.data.series.push(dataSeriesArray);
    });

    const columns: any[][] = [];
    let legendLabels: string[] = [];

    // xColumn
    const xValues: any[] = [];
    xValues.push('xValues');
    this.data.labels.forEach((label) => {
      xValues.push(label);
    });

    columns.push(xValues);

    // For C3.. Put the name of the series as the first element of each series array
    for (let i = 0; i < this.legends.length && this.data.series.length; ++i) {
      let legend: string;
      if(linechartData.meta.removePrefix){
        legend  = this.legends[i].replace(linechartData.meta.removePrefix, "");
      } else {
        legend  = this.legends[i];
      }

      legendLabels.push(legend);

      let series: any[] = this.data.series[i];
      if( typeof(series) !== 'undefined' && series.length > 0 ) {
        series.unshift(legend);
      } else {
        series = [legend];
      }
      columns.push(series);
    }
    this.legendLabels.next(legendLabels);


    this.chart = c3.generate({
      interaction: {
        enabled:true
      },
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
            //format: '%H:%M:%S',
            format: this.timeFormat,
            fit: true,
            //values: ['01:10', '03:10', '06:10']
            culling: { 
              max: this.culling
            }
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
        show: false
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

  public fetchData(rrdOptions, timeformat?: string, culling?:number){
    if(timeformat){
      this.timeFormat = timeformat;
    }
    if(culling){
      this.culling = culling;
    }

    // Convert from milliseconds to seconds for epoch time
    rrdOptions.start = Math.floor(rrdOptions.start / 1000);
    if(rrdOptions.end){
      rrdOptions.end = Math.floor(rrdOptions.end / 1000);
    }

    // This is the time portion of the API call.  
    this._lineChartService.getData(this, this.dataList, rrdOptions);
  }

  public convertTo(value, conversion){
    let result;
    switch(conversion){
    case 'bytesToGigabytes':
      result = value / 1073741824;
      break;
    case 'percentFloatToInteger':
      result = value * 100;
      break;
    }

    return result.toFixed(2);
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
  }

  ngOnDestroy(){
    this.core.unregister({observerClass:this});
  }

}
