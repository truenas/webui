import { Component, OnInit, OnChanges } from '@angular/core';
import { ViewComponent } from 'app/core/components/view/view.component';
import {UUID} from 'angular2-uuid';
import * as c3 from 'c3';
import {ChartConfiguration} from 'c3';

export interface ChartData {
  legend: string;
  data: any[];
}

export const ViewChartMetadata = {
  template: `<div id="{{chartId}}" [ngClass]="chartClass"></div>`
}

@Component({
  selector: 'viewchart',
  template: ViewChartMetadata.template,
  //templateUrl: './viewchart.component.html',
  styleUrls: ['./viewchart.component.css']
})
export class ViewChartComponent extends ViewComponent implements OnInit {

  public chartColors: string[];
  public maxLabels: number;
  public units: string;
  public width: number;
  public height: number;

  protected chart: any;
  protected _chartType: string;
  protected _data: any[];
  protected _chartId: string;
  protected colors: string[];

  protected chartConfig: ChartConfiguration;

  constructor() { 
    super();
    this.chartId = "chart-" + UUID.UUID();
    this.chartType = "pie";
    this.units = '';
  }

  ngOnInit() {
    this.render();
  }

  ngOnChanges() {
    console.log("OnChanges");
    this.render();
  }

  get data(){
    return this._data;
  }

  set data(d:ChartData[]){
    if(/*!this.chartConfig ||*/ !d){
      /*this.chartConfig = {
        data:{
          columns:[]
        }
      }*/
      this._data = [];
    } else {
      let result: any[] = [];
     
      for(let i = 0; i < d.length; i++){
        let item = d[i];
        let legend = [item.legend];
        let dataObj = legend.concat(item.data)
        result.push(dataObj);
      }
      this._data = result;

      console.log("DEBUG: set data() ********");
      console.log(d);
      //console.log(this.chartConfig);

      //this.chartConfig.data.columns = result;
      this.render();
    }
  }

  get chartId(){
    return this._chartId;
  }

  set chartId(sel: string){
    this._chartId = sel;
    //this.chartConfig.bindto = '#' + sel;
  }

  get chartClass(){
    return this._chartType;
    //return this.chartConfig.data.type;
  }

  get chartType(){
    return this._chartType;
    //return this.chartConfig.data.type;
  }

  set chartType(str:string){
    this._chartType = str;
    //this.chartConfig.data.type = str;
  }

  makeConfig(){
    this.chartConfig = {
     bindto: '#' + this.chartId,
     data: {
       columns: this._data,
       type: this.chartType
     },
     size:{
       width: this.width,
       height: this.height
     },
     tooltip:{
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
    return this.chartConfig;
  }

  render(){
    if(this.data.length == 0){
      console.log("NO DATA FOUND");
      return -1;
    }

    let conf = this.makeConfig();
    let colors = this.colorsFromTheme();
    if(colors){
      let color = {
        pattern: colors
      }
      conf.color = color;
    }
    
    console.log("GENERATING DATA FROM ...");
    console.log(conf);
    this.chart = c3.generate(conf);
    return this.chart
  }

}
