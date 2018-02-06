import { Component, OnInit } from '@angular/core';
import { ViewChartComponent, ViewChartMetadata } from 'app/core/components/viewchart/viewchart.component';
import * as d3 from 'd3';

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
    if(str == 'line' || str == 'area' || str == 'spline' || str == 'area-spline' || !str){
      this._chartType = str;
    } else {
      console.warn("chartType must be a valid line chart type (line, area, spline or area-spline)")
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
          inner:true,
          /*tick:{
            format: d3.format(this.units)
          }*/
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
        show: false,
        size:{
          height:24
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
        //show:false,
        grouped:true,
        /*position:(data, width, height, element) => {
          let x = (parseInt(element.getAttribute('x')));
          let y = 0;
          let w = (parseInt(element.getAttribute('width')));
          let h = (parseInt(element.getAttribute('height')));

          let left = x + (w/2);
          this.tooltipHeight = String((h*0.8));
          return {top: y, left: left}
        },*/
        contents: (raw, defaultTitleFormat, defaultValueFormat, color) => {
          //console.log(this.data);
          //if(!this.tooltipHeight){ return "";}
          //let tthSplit = this.tooltipHeight.split('px');
          //let tth = Math.floor(Number(tthSplit[0]));
          //let h = tth/raw.length;
          //let time = defaultTitleFormat(raw[0].x);
          let time = raw[0].x;
          //DEBUG: console.log(time);
          //let preList = '<div style="min-height:' + this.tooltipHeight + ';"><table>';
          /*let preList = '<div><table>';
          let list = '<tr><td><strong>' + time + '</strong></td></tr>';
          let postList = '</table></div>';
          for(let i in raw){
            let c = color(raw[i]);
            let d = Math.floor(raw[i].value)
            let markup = '<tr class="tooltip"><td class="module-triangle-bottom" style="border-left:solid 6px ' + c + ';">  ' + raw[i].name + ':</td><td>' +  d + this.units + '</td></tr>';
            list += markup;
          }
          //let focus = defaultTitleFormat(d);
          return preList + list + postList;*/
          return '<div style="display:none;">tooltips disabled</div>'
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

      //DEBUG: console.log("TIME SETUP");
      //DEBUG: console.log(xAxis);
    }

    //DEBUG: console.log(this.chartConfig);
    //DEBUG: console.log(this._data);
    return this.chartConfig;
  }

}
