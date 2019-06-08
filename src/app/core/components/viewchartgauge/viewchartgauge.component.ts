import { Component, AfterViewInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ViewChartComponent, ViewChartMetadata } from 'app/core/components/viewchart/viewchart.component';
import {UUID} from 'angular2-uuid';
//import { DisplayObject } from 'app/core/classes/display-object';
//import * as c3 from 'c3';
import * as d3 from 'd3';
import { transition } from 'd3-transition'
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

export interface GaugeConfig {
  label: boolean; // to turn off the min/max labels.
  units: string;
  min?: number; // 0 is default, //can handle negative min e.g. vacuum / voltage / current flow / rate of change
  max?: number; // 100 is default
  width?: number; // for adjusting arc thickness
  data: any;
}

@Component({
  selector: 'viewchartgauge',
  //template:ViewChartMetadata.template
  templateUrl: './viewchartgauge.component.html',
  //styleUrls: ['./viewchartdonut.component.css']
})
export class ViewChartGaugeComponent /*extends DisplayObject*/ implements AfterViewInit, OnChanges {

  public title:string = '';
  public chartType: string = 'gauge';
  public chartClass: string = 'view-chart-gauge';
  private _data;
  private arc;
  public chartId = UUID.UUID();
  private doublePI = 2 * Math.PI;
  public units = "%"; // default unit type

  /*private gaugeConfig: GaugeConfig = {
    label: true,
    units: this.units,
    data: []
  }*/

  @Input() config: GaugeConfig;

  constructor() { 
    //super();
  }

  ngOnChanges(changes: SimpleChanges) {
    if(changes.config){
      if(changes.config.currentValue && changes.config.currentValue.data){
        //console.log(changes.config.currentValue.data);
        this.data = changes.config.currentValue.data;
        if(!this.arc){
          //console.log("No chart");
          //console.log(this.data);
          this.render();
        } else {
          //console.log("Chart");
          //console.log(this.arc);
          //console.log(changes.config.currentValue.data[1]);
          this.update(changes.config.currentValue.data[1]);
          
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
    //let tau = 2 * Math.PI; 

    this.arc = d3.arc()
        .innerRadius(80)
        .outerRadius(90)
        .startAngle(0);
    
    let width = 240;
    let height = 240;
    let svg = d3.select("#gauge-" + this.chartId).append("svg")
      .attr("width", width)
      .attr("height", height)

    let g = svg.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
    
    /*let fontSize = 18;
    let text = svg.append("text")
        .style("fill", "var(--fg2)")
        .attr("x", width / 2)
        .attr("y", (height / 2) - (fontSize / 2))*/
    
    let background = g.append("path")
        .datum({endAngle: this.doublePI})
        .style("fill", "#ddd")
        .attr("d", this.arc);
    
    let foreground = g.append("path")
        .datum({endAngle: 0.127 * this.doublePI})
        .style("fill", "orange")
        .attr("class", "value")
        .attr("d", this.arc);

    this.update(this.config.data[1])
  }

  update(value){
      d3.transition()
          .select('#gauge-' + this.chartId + ' path.value')
          .duration(750)
          .attrTween("d", this.load(this.percentToAngle(value)));

      /*d3.select("svg text")
        .text(value)*/
        //.enter()
  }

  load(newAngle){
    return (d) => {

    let interpolate = d3.interpolate(d.endAngle, newAngle);

      return (t) => {
  
        d.endAngle = interpolate(t);
  
        return this.arc(d);
      };
    };
  }

  percentToAngle(value){
    return value  / 100 * this.doublePI;
    //return 360 * (value / 100) * this.doublePI;
  }
  

  /*makeConfig(){
  
    this.chartConfig = {
      bindto: '#' + this._chartId,
      data: {
        //columns: this._data,
        columns: this.config.data,
        type: this.chartType
      },
      gauge:{
        label:{
          //show: this.gaugeConfig.label
          show: false
        },
        width:15,
        fullCircle:true
      },
      size:{
        width: this.config.width,
        height: this.config.width
      },
      tooltip:{
        show: false,
      },
      interaction: {
        enabled: false
      }
    }

    return this.chartConfig;
  }*/



}
