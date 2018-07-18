import { Component, AfterViewInit, OnInit, OnChanges, Input, HostListener } from '@angular/core';
import {UUID} from 'angular2-uuid';
import * as d3 from 'd3';
import * as c3 from 'c3';
import { ChartConfiguration, LegendOptions, TooltipOptions } from 'c3';

export interface ChartData {
  legend: string;
  data: any[];
}

export interface Legend {
  swatch?: string;
  name:string;
  value?:number | string;
  x?: number | string;
  visible: boolean;
}

@Component({
  selector: 'c3-chart',
  templateUrl: './c3chart.component.html',
  styleUrls: ['./c3chart.component.css']
})
export class C3ChartComponent implements AfterViewInit {
  public chart: any;
  public chartId: string;
  public chartLoaded: boolean = false;
  //public units: string = " MiB";
  public themeColors: string[] = ['#bd93f9','#50fa7b','#f1fa8c','#ff79c6','#8be9fd','#ff5555','#6272a4','#ffb86c'];
  public chartColors:any;
  public chartConfig: ChartConfiguration; 
  public legend: Legend[] = [];
  protected tooltipOptions: TooltipOptions = {
    contents: (raw, defaultTitleFormat, defaultValueFormat, color) => {
      //DEBUG: console.log("******** TOOLTIP VALUES ********");
      //DEBUG: console.log(raw)
      /*if(!this.showLegendValues){
       this.showLegendValues = true;
      }*/
      let time = raw[0].x;
      for(let index = 0; index < this.legend.length; index++){
        //DEBUG: console.log("Looking for value");
        for(let i = 0; i < raw.length; i++){
          if(this.legend[index].name == raw[i].name){
            //DEBUG: console.log("NAME MATCHED!");
            this.legend[index].value = raw[i].value;
            //DEBUG: console.log(this.legend);
            }
        }
        this.legend[index].x = time;
      }
      return '<div style="display:none">' + time + '</div>';
    }
  }

  private sampleData = [
    ['x', '2013-01-01', '2013-01-02', '2013-01-03', '2013-01-04', '2013-01-05', '2013-01-06', '2013-01-07', '2013-01-08', '2013-01-09', '2013-01-10', '2013-01-11', '2013-01-12'],
    ['data1', 30, 200, 100, 400, 150, 250, 130, 340, 200, 500, 250, 350],
    ['data2', 50, 20, 10, 40, 15, 25, 30, 200, 100, 400, 150, 250]
  ]
  @Input() data:any;
  @Input() max:number;
  @Input() min?:number;
  @Input() units:string;
  @Input() timeseries:boolean;

  constructor() { 
    this.chartId = "chart-" + UUID.UUID();
    //this.chartType = "pie";
    //this.units = '';
    }

  makeConfig(chartData){
    this.chartConfig = {
      bindto:"#" + this.chartId,
      size:{
        height:240
      },
      data: {
        type: 'area-spline',
        x:'x',
        columns: chartData,
      },
      axis: {
        x: {
          //type: 'category', // Another option
          type: this.timeseries ? 'timeseries' : 'category',
          tick: {
            format: '%Y-%m-%d', // For timeseries
            culling: {
              max: 4 // the number of tick texts will be adjusted to less than this value
            }
            // for normal axis, default on
            // for category axis, default off
            }
        },
        y:{
          inner:false,
          tick:{
            //format: d3.format(this.units) // d3 is undefined. 
            format: (d) => { return d + this.units; }
          },
          max:this.max,
          min:this.min
        }
      },
      grid: {
        x: {
          show: true
        },
        y: {
          show: true
        }
      },
      legend: {
        show: false
      },
      tooltip:{
        contents: this.tooltipOptions.contents
      },
      subchart: {
        show: true,
        size:{
          height:24
        }
      },
      zoom:{
        enabled: true
      }
    }

    this.setColors();
    this.setLegend();
    this.render();
  }

  // LifeCycle Hooks
  ngAfterViewInit() {
    //DEBUG: console.log("******** CHART DIMENSIONS - Width:" + this.width + "/ Height: " + this.height);
    setTimeout(() => {
      //this.render();
      if(!this.data){
        this.makeConfig(this.sampleData);  
      } else {
        this.makeConfig(this.data);
      }
      console.warn(this.legend)
    }, 2000);
  }

  ngOnChanges(changes) {
    //DEBUG: console.log("OnChanges");
    if(changes.data && this.data && this.data.length > 0){ // This only works with @Input() properties
      //this.chartConfig.data.columns = this.data;
      //this.render();
      this.makeConfig(this.data);
    }
  }

  public refresh(){
    this.render();
  }

  focus(item){
    // This toggles visibility of legend items
    if(item.visible){
      this.chart.hide(item.name);
    } else {
      this.chart.show(item.name);
    }
    item.visible = !item.visible;
  }

  private setLegend(){
    let result = [];
    let columns = this.chartConfig.data.columns;
    for(let i = 1; i < columns.length; i++){
      let item = {
        swatch: this.themeColors[i],
        name: columns[i][0],
        value:15,
        x:0,
        visible: true
      }
      result.push(item);
    }
    this.legend = result;
  }

  protected setColors(){
    let result = {}
      for(let i = 1; i < this.chartConfig.data.columns.length; i++){
        let src = this.chartConfig.data.columns[i][0];
        //console.warn(src);
        if(src !== "x"){
          result[src.toString()] = this.themeColors[i];
        }
      }
      this.chartConfig.data.colors = result;
  }

  protected render(){
    if(this.chartConfig.data.columns.length == 0 || !this.data){
      console.warn("C3: data.columns is empty");
      return -1;
    }
    this.chart = c3.generate(this.chartConfig);
    this.chartLoaded = true;
    return this.chart;
  }

}
