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
  diameter: number;
  fontSize: number;
  min?: number; // 0 is default, //can handle negative min e.g. vacuum / voltage / current flow / rate of change
  max?: number; // 100 is default
  width?: number; // for adjusting arc thickness
  data: any;
}

@Component({
  selector: 'viewchartgauge',
  templateUrl: './viewchartgauge.component.html',
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
  public diameter = 120; // default diameter

  @Input() config: GaugeConfig;

  constructor() { 
  }

  ngOnChanges(changes: SimpleChanges) {
    if(changes.config){
      if(changes.config.currentValue && changes.config.currentValue.data){
        this.data = changes.config.currentValue.data;
        if(!this.arc){
          this.render();
        } else {
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
    let lineWidth = 10;
    this.arc = d3.arc()
        .innerRadius(this.config.diameter / 2 - lineWidth) // 80
        .outerRadius(this.config.diameter / 2) // 90
        .startAngle(0);
    
    let width = this.config.diameter;
    let height = this.config.diameter;
    let svg = d3.select("#gauge-" + this.chartId).append("svg")
      .attr("width", width)
      .attr("height", height)

    let g = svg.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
    
    let text = svg.append("text");
    if(!text.node()){
      // Avoid console errors if text.node isn't available yet.
      return;
    }
    let bbox = text.node().getBBox();
    
    text.style("fill", "var(--fg2)")
        .style("font-size", this.config.fontSize.toString() + "px")
        .attr("x", width / 2)
        .attr("y", height / 2 )
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "central")
    
    let background = g.append("path")
        .datum({endAngle: this.doublePI})
        .style("fill", "var(--bg1)")
        .attr("d", this.arc);
    
    let foreground = g.append("path")
        .datum({endAngle: 0.127 * this.doublePI})
        .style("fill", "var(--primary)")
        .attr("class", "value")
        .attr("d", this.arc);

    this.update(this.config.data[1])
  }

  update(value){
      d3.transition()
          .select('#gauge-' + this.chartId + ' path.value')
          .duration(750)
          .attrTween("d", this.load(this.percentToAngle(value)));

    d3.select('#gauge-' + this.chartId + ' text')
          .text(value + this.config.units)
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

}
