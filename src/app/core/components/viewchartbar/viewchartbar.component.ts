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

export interface BarChartConfig {
  label: boolean; // to turn off the min/max labels.
  units: string;
  min?: number; // 0 is default, //can handle negative min e.g. vacuum / voltage / current flow / rate of change
  max?: number; // 100 is default
  width?: number; 
  data: BarDataSource[];
}

export interface BarDataSource {
  name: string;
  dataPoints: number[]
}

@Component({
  selector: 'viewchartbar',
  //template:ViewChartMetadata.template
  templateUrl: './viewchartbar.component.html',
  styleUrls: ['./viewchartbar.component.css']
})
export class ViewChartBarComponent /*extends DisplayObject*/ implements AfterViewInit, OnChanges {

  public title:string = '';
  public chartClass: string = 'view-chart-bar';
  private _data;
  public chartId = UUID.UUID();
  private xScale;
  private yScale;

  @Input() config: BarChartConfig;
  //@Input() width: number;
  //@Input() height: number;

  constructor() { 
    //super();
  }

  ngOnChanges(changes: SimpleChanges) {
    if(changes.config){
      if(changes.config.currentValue && changes.config.currentValue.data){
        //console.log(changes.config.currentValue.data);
        this.data = changes.config.currentValue.data;
        //console.warn(this.config.data);
        /*if(!this.arc){
          //console.log("No chart");
          //console.log(this.data);
          this.render();
        } else {
          //console.log("Chart");
          //console.log(this.arc);
          //console.log(changes.config.currentValue.data[1]);
          this.update(changes.config.currentValue.data[1]);
          
        }*/
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
    let wrapper = d3.select("#bar-" + this.chartId);
    let wrapperNode = styler(document.querySelector("#bar-" + this.chartId),{})
    console.warn(this.config.data);
    //console.warn(wrapperNode.getBoundingClientRect())
    const margin = 32;
    let width = wrapperNode.get("width") ;//* margin;
    let height = wrapperNode.get("height") ;//* margin;

    const svg = wrapper.append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr("style", "stroke: var(--fg1)")

    const yScale = d3.scaleLinear()
        .range([height - margin * 2, 0])
        .domain([0, this.config.max ? this.config.max : 100]);

    svg.append('g')
        .attr('transform', `translate(${width - margin}, ${margin})`)
        .call(d3.axisRight(yScale).ticks(5))
        //.call(d3.axisRight(yScale).ticks(5));

      // add the Y gridlines
      let make_y_gridLines = () => {
        return d3.axisLeft(yScale).ticks(5)
      }

      svg.append("g")			
        .attr("class", "grid")
        .attr('transform', `translate(${margin}, ${margin})`)
        .call(make_y_gridLines()
            .tickSize(-(width - margin * 2))
            //.tickFormat("")
        )

    // Hide Y axis
    d3.selectAll("#bar-" + this.chartId + " svg path.domain")
      .style("stroke-opacity", 0)

    // Hide Y axis
    d3.selectAll("#bar-" + this.chartId + " svg .tick line")
      .style("stroke", "var(--fg1)")
      .style("opacity", "0.15")

    const xScale = d3.scaleBand()
        .range([0, width - margin * 2])
        /*.domain(this.config.data[0].dataPoints.map((s) => {
          return [this.config.data[s]]
        }))
        .padding(0.2)*/
        //.domain(this.config.data[0].dataPoints.map((s) => this.config.data.dataPoints))

    // X axis
    svg.append('g')
        .attr('transform', `translate(${margin}, ${height - margin})`)
        .style("stroke-opacity", 0)
        .call(d3.axisBottom(xScale));

        

    this.update(this.config.data[1])
  }

  update(value){
  }

  load(newAngle){
    /*return (d) => {

    let interpolate = d3.interpolate(d.endAngle, newAngle);

      return (t) => {
  
        d.endAngle = interpolate(t);
  
        return this.arc(d);
      };
    };*/
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
