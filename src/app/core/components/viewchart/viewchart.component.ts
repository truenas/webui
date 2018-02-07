import { Component, AfterViewInit, OnInit, OnChanges, Input } from '@angular/core';
import { LayoutChild } from 'app/core/classes/layouts';
import { ViewComponent } from 'app/core/components/view/view.component';
import {UUID} from 'angular2-uuid';
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

export const ViewChartMetadata = {
  template: `
    <div class="viewchart-wrapper {{chartClass}}-wrapper">
      <div *ngIf="chartLoaded" class="legend-wrapper">
        <div class="legend-x legend-item" *ngIf="chartConfig.data.x">Time: <span *ngIf="showLegendValues">{{legend[0].x}}</span></div>
        <div class="legend-html" fxLayout="row" fxLayoutAlign="space-between" fxLayoutGap="16px" >
          <ng-container *ngFor="let item of legend; let i=index ">
            <div class="legend-item" *ngIf="chartType != 'gauge'" (click)="focus(legend[i])" [ngClass]="{'legend-item-disabled':!legend[i].visible}">
              <span class="legend-swatch" [style.background-color]="legend[i].swatch"></span>
              <span class="legend-name">{{legend[i].name}}: </span>
              <div class="legend-value" [style.color]="legend[i].swatch"><span *ngIf="showLegendValues">{{legend[i].value}}{{units}}</span></div>
            </div>
          </ng-container>
        </div>
      </div>
      <div id="{{chartId}}" [ngClass]="chartClass">
      </div>
    </div>
  `
}

@Component({
  selector: 'viewchart',
  template: ViewChartMetadata.template,
  //templateUrl: './viewchart.component.html',
  styleUrls: ['./viewchart.component.css']
})
export class ViewChartComponent extends ViewComponent implements AfterViewInit {

  public chartColors: string[];
  public maxLabels: number;
  public units: string;
  @Input() width: number;
  @Input() height: number;

  public chart: any;
  public chartLoaded: boolean = false;
  protected _chartType: string;
  protected _data: any[];
  protected _chartId: string;
  protected colors: string[];
  public legend: Legend[] = [];
  public showLegendValues: boolean = false;
  protected legendOptions: LegendOptions = {
    show: false
  };
  protected tooltipOptions: TooltipOptions = {
    contents: (raw, defaultTitleFormat, defaultValueFormat, color) => {
      if(!this.showLegendValues){
        this.showLegendValues = true;
      }
      let time = raw[0].x;
      //console.log("******** TOOLTIP VALUES ********");
      for(let index = 0; index < this.legend.length; index++){
        //console.log("Looking for value");
        for(let i = 0; i < raw.length; i++){
          if(this.legend[index].name == raw[i].name){
            this.legend[index].value = raw[i].value;
            //console.log(this.legend);
          }
        }
        this.legend[index].x = time;
      }
      return '<div style="display:none">' + time + '</div>';
    }
  }

  protected chartConfig: ChartConfiguration;

  constructor() { 
    super();
    this.chartId = "chart-" + UUID.UUID();
    this.chartType = "pie";
    this.units = '';
  }

  ngAfterViewInit() {
    console.log("******** CHART DIMENSIONS - Width:" + this.width + "/ Height: " + this.height);
    this.render();
  }

  ngOnChanges(changes) {
    console.log("OnChanges");
    if(changes.data){
      this.render();
    }
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

        // setup data
        let item = d[i];
        let legend = [item.legend];
        let dataObj = legend.concat(item.data)
        result.push(dataObj);

        let legendHtmlItem: Legend = {swatch:'',name:item.legend, value: "empty", x:"empty", visible:true};
        if(this.chartType == "donut" || this.chartType == "pie"){
          console.log("******** DONUT/PIE LEGEND VALUE ********");
          console.log(legendHtmlItem);
          legendHtmlItem.value = d[i].data[0];
          this.showLegendValues = true;
        }
        this.legend.push(legendHtmlItem)
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
       show:false,
       /*contents: (raw, defaultTitleFormat, defaultValueFormat, color) =>{
         console.log(raw[0]);
           //return ... // formatted html as you want
       }*/
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

  focus(item){
    if(item.visible){
      this.chart.hide(item.name);
    } else {
      this.chart.show(item.name);
    }
    item.visible = !item.visible;
  }

  refresh(){
    this.render();
  }

  render(){
    if(this.data.length == 0){
      console.log("NO DATA FOUND");
      return -1;
    }

    let conf = this.makeConfig();
    let colors = this.colorsFromTheme();
    console.log(colors);
    if(colors){
      let color = {
        pattern: colors
      }
      conf.color = color;
    }

    // Hide legend. We've moved the legends out of the svg and into Angular
    conf.legend = this.legendOptions;
    conf.tooltip = this.tooltipOptions;
    if(this.legend.length > 0 && colors){
      console.log(conf);
      for(let i in this.legend){
        this.legend[i].swatch = conf.color.pattern[i];
      }
    }
    if(this.chartType != "donut" && this.chartType != "pie"){
      conf.data.onmouseout = (d) => {
        this.showLegendValues = false;
      }
    }

    console.log("GENERATING DATA FROM ...");
    this.chart = c3.generate(conf);
    this.chartLoaded = true;
    return this.chart
  }

}
