import { Component, AfterViewInit, Input, ViewChild, ElementRef, OnChanges, SimpleChanges } from '@angular/core';
import { ViewChartComponent, ViewChartMetadata } from 'app/core/components/viewchart/viewchart.component';
import {UUID} from 'angular2-uuid';
import * as d3 from 'd3';
import { transition, Transition } from 'd3-transition'
import {
  tween,
  styler,
  listen,
  pointer,
  value,
  decay,
  spring,
  physics,
  easing,
  everyFrame,
  keyframes,
  timeline,
  //velocity,
  multicast,
  action,
  transform,
  //transformMap,
  //clamp
  } from 'popmotion';

export interface BarChartConfig {
  label: boolean; // to turn off the min/max labels.
  units: string;
  min?: number; // 0 is default, //can handle negative min e.g. vacuum / voltage / current flow / rate of change
  max?: number; // 100 is default
  width?: number; 
  data: BarDataSource[];
  orientation?: string; // horizontal || vertical
}

export interface BarDataSource {
  coreNumber: number;
  usage?: number | string;
  temperature?: number | string;
}

@Component({
  selector: 'viewchartbar',
  templateUrl: './viewchartbar.component.html',
  styleUrls: ['./viewchartbar.component.css']
})
export class ViewChartBarComponent implements AfterViewInit, OnChanges {

  public title:string = '';
  private chart: any; 
  public chartClass: string = 'view-chart-bar';
  public chartConfig: any;
  private _data;
  public chartId = UUID.UUID();
  private xScale;
  private yScale;
  private barScale;
  private margin;
  private wrapperNode;

  @Input() config: BarChartConfig;
  @ViewChild('wrapper', {static: true}) el: ElementRef;

  constructor() { 
    //super();
  }

  ngOnChanges(changes: SimpleChanges) {
    if(changes.config){
      if(changes.config.currentValue && changes.config.currentValue.data){

        this.data = changes.config.currentValue.data;

        if(!this.wrapperNode){
          this.render();
        } else {
          this.update(changes.config.currentValue.data);
        }
      }
    }
  }

  ngAfterViewInit() {
    this.render();
  }

  get data(){
    return this._data
  }

  set data(d){
    this._data = d;
  }

  render(){
    this.margin = 32;

    let wrapper = d3.select("#bar-" + this.chartId);
    if(!this.el){ return }
    console.log(this.el.nativeElement);
    this.wrapperNode = styler(this.el.nativeElement,{});

    this.chartConfig = this.makeConfig();
  }

  update(data?){
    if(!data){ data = this.config.data}
    
      this.chart.load({
        columns: this.config.data,
      })
      
  }
  

  makeConfig(){
  
    this.chartConfig = {
      bindto: '#bar-' + this.chartId,
      data: {
        columns: this.config.data,
        type: 'bar'
      },
      bar:{
        label:{
          show: false
        },
        width:15,
        fullCircle:true
      },
      tooltip:{
        show: false,
      },
      interaction: {
        enabled: false
      },
      legend: {
        hide:true
      }
    }
    return this.chartConfig;
  }



}
