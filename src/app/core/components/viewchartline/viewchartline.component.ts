import { Component, OnInit } from '@angular/core';
import { ViewChartComponent, ViewChartMetadata } from 'app/core/components/viewchart/viewchart.component';
//import * as c3 from 'c3';

interface TimeData {
  start: number;
  end: number;
  step: number;
  legend?: string;
}

@Component({
  selector: 'viewchartline',
  template:ViewChartMetadata.template
})
export class ViewChartLineComponent extends ViewChartComponent implements OnInit {

  //public chartType: string;
  public timeSeries: boolean;
  public timeFormat: string;
  //public timeData: TimeData;

  protected _tooltipHeight:string;
  protected _chartType: string;
  protected _timeData: TimeData;

  constructor() { 
    super();
    this.chartType = "line";
    this.timeFormat = '%m/%d/%Y'
  }

  ngOnInit() {
  }

  get chartType(){
    return this._chartType;
  }

  set chartType(str: string){
    if(str == 'line' || str == 'area' || str == 'spline' || str == 'area-spline'){
      this._chartType = str;
    } else {
      throw "chartType must be a valid line chart type (line, area, spline or area-spline)"
    }
  }

  get tooltipHeight(){
    return this._tooltipHeight;
  }

  set tooltipHeight(tth:string){
    this._tooltipHeight = tth + 'px';
  }

  get timeData(){
    return this._timeData;
  }

  set timeData(td: TimeData){
    this._timeData = td;
  }

  protected makeTimeAxis(td:TimeData, axis?: string):any[]{
    if(!axis){ axis = 'x';}
    let labels: any[] = [axis];
    this._data[0].forEach((item, index) =>{
      let date = new Date(td.start * 1000 + index * td.step * 1000);
      labels.push(date);
    });

    return labels;
  }

  makeConfig(){
  
    this.chartConfig = {
      bindto: '#' + this._chartId,
      grid: {
        x: {
          show: false
        },
        y: {
          show: true
        }
      },
      axis: {
        x: {
          padding:{
            left:0,
            right:0
          },
          tick: {
            format: '%H:%M:%S',
            fit: true,
            culling: {
              max: 5
            }
          }
        },
        y:{
          inner:false
        }
      },
      data: {
        type: this.chartType, 
        columns: this._data
      },
      size:{
        //width: this.width,
        //height: this.height
        },
      subchart: {
        show: true,
        size:{
          height:32
        }
      },
      zoom:{
        enabled: true
      },
      legend:{
        position:'top',
        show:false
      },
      tooltip:{
        grouped:true,
        position:(data, width, height, element) => {
          let x = (parseInt(element.getAttribute('x')));
          let y = 0;
          let w = (parseInt(element.getAttribute('width')));
          let h = (parseInt(element.getAttribute('height')));

          let left = x + (w/2);
          this.tooltipHeight = String((h*0.8));
          return {top: y, left: left}
        },
        contents: (raw, defaultTitleFormat, defaultValueFormat, color) => {
          console.log(raw[0]);
          let c = color(raw[0]);
          let d = Math.floor(raw[0].value)
          let markup = '<div id="tooltip" class="module-triangle-bottom" style="height:' + this.tooltipHeight + ';border-left:solid 6px ' + c + ';">' + raw[0].name + ': ' +  d + this.units + '</div>'
          //let focus = defaultTitleFormat(d);
          return markup;
        },
        format: {
          value: (value, ratio, id, index) => {
            if(this.units){
              console.log("Units = " + this.units)
              return value + this.units; 
            } else {
              return value;
            }
          }
        }
      }
    }

    if(this.timeSeries && this.timeData){
      this.chartConfig.data.x = 'x';
      this.chartConfig.axis.x.type = 'timeseries';
      this.chartConfig.axis.x.tick.format = this.timeFormat;
      let xAxis = this.makeTimeAxis(this.timeData);
      this._data.unshift(xAxis);

    console.log("TIME SETUP");
    console.log(xAxis);
    }

    console.log(this.chartConfig);
    console.log(this._data);
    return this.chartConfig;
  }

}
