import { Component, AfterViewInit, Input, ViewChild, ElementRef, OnChanges, SimpleChanges } from '@angular/core';
import { ViewChartComponent, ViewChartMetadata } from 'app/core/components/viewchart/viewchart.component';
import {UUID} from 'angular2-uuid';
//import { DisplayObject } from 'app/core/classes/display-object';
import * as c3 from 'c3';
import * as d3 from 'd3';
//import { select, Selection } from 'd3-selection';
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
  //template:ViewChartMetadata.template
  templateUrl: './viewchartbar.component.html',
  styleUrls: ['./viewchartbar.component.css']
})
export class ViewChartBarComponent /*extends DisplayObject*/ implements AfterViewInit, OnChanges {

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
    this.chart = c3.generate(this.chartConfig);
    /*
    let width = this.wrapperNode.get("width") ;
    let height = this.wrapperNode.get("height") ;

    const svg = wrapper.append('svg')
        .attr('id', 'svg-' + this.chartId)
        .attr('width', width)
        .attr('height', height)
        .attr("style", "stroke: var(--fg1)")

    this.yScale = d3.scaleLinear()
        .range([height - this.margin * 2, 0])
        .domain([0, this.config.max ? this.config.max : 100]);

    svg.append('g')
        .attr('transform', `translate(${width - this.margin}, ${this.margin})`)
        .call(d3.axisRight(this.yScale).ticks(5))

      // add the Y gridlines
      let make_y_gridLines = () => {
        return d3.axisLeft(this.yScale).ticks(5)
      }

      svg.append("g")			
        .attr("class", "grid")
        .attr('transform', `translate(${this.margin}, ${this.margin})`)
        .call(make_y_gridLines()
            .tickSize(-(width - this.margin * 2))
            //.tickFormat("")
        )

    // Hide Y axis
    d3.selectAll("#bar-" + this.chartId + " svg path.domain")
      .style("stroke-opacity", 0)

    // Hide Y axis
    d3.selectAll("#bar-" + this.chartId + " svg .tick line")
      .style("stroke", "var(--fg1)")
      .style("opacity", "0.15")

    let cores = this.config.data.map((s:any) => {
            return s.coreNumber;
    });
    
    this.xScale = d3.scaleBand() // was scaleBand
        .domain(cores)
        .range([0, width - this.margin * 2])
        .padding(0.9)

    // X axis
    svg.append('g')
        .attr('transform', `translate(${this.margin}, ${height - this.margin})`)
        .style("stroke-opacity", 0)
        .call(d3.axisBottom(this.xScale));

    this.barScale = this.config.orientation == 'horizontal' ? this.xScale : this.yScale
    d3.select('#svg-' + this.chartId)
	.selectAll('rect')
	.data(this.config.data)
	.enter()
	.append('rect')
        .style('stroke-opacity', 0)
        .style('fill', 'var(--primary)')
        .style('fill-opacity', '0.75')
        .attr('class','bar')
	.attr('x', (d:BarDataSource) => {
		return this.margin + this.xScale(d.coreNumber);
	})
	.attr('width', this.barScale.bandwidth())
	.attr('height', (d:BarDataSource, i) => this.yScale(d.usage))
	.attr('y', (d:BarDataSource) => {
		return height - this.margin - this.yScale(d.usage);
	})*/
  }

  update(data?){
    if(!data){ data = this.config.data}
    
      this.chart.load({
        columns: this.config.data,
      })
      
    /*
    //this.wrapperNode = styler(document.querySelector("#bar-" + this.chartId),{})
    let height = this.wrapperNode.get("height") ;

    let elems = this.el.nativeElement.querySelectorAll('rect.bar');
    let stylerElems = styler(elems);
    elems.forEach((item, index) => {
      let bar = styler(item);
      //console.log(bar.get('height'));
      tween({
        from: {y: bar.get('y'), height: bar.get('height')},
        to: {
          y: this.yScale(this.config.data[index].usage), 
          height: stylerElems.get('height') - this.margin - this.yScale(this.config.data[index].usage)
        },
        duration:750
      }).start(bar.set);
    });*/
  }
  

  makeConfig(){
  
    this.chartConfig = {
      bindto: '#bar-' + this.chartId,
      data: {
        //columns: this._data,
        columns: this.config.data,
        type: 'bar'
      },
      bar:{
        label:{
          //show: this.gaugeConfig.label
          show: false
        },
        width:15,
        fullCircle:true
      },
      /*size:{
        width: this.config.width,
        height: this.config.width
      },*/
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
