import { Component, AfterViewInit, Input, ViewChild, OnDestroy} from '@angular/core';
import { CoreServiceInjector } from 'app/core/services/coreserviceinjector';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { MaterialModule } from 'app/appMaterial.module';
import { NgForm } from '@angular/forms';
import { ChartData } from 'app/core/components/viewchart/viewchart.component';
import { Subject } from 'rxjs';

import { Router } from '@angular/router';
import { UUID } from 'angular2-uuid';
import * as d3 from 'd3';
import * as c3 from 'c3';

import filesize from 'filesize';
import { WidgetComponent } from 'app/core/components/widgets/widget/widget.component';

import { ViewChartGaugeComponent } from 'app/core/components/viewchartgauge/viewchartgauge.component';
import { ViewChartBarComponent } from 'app/core/components/viewchartbar/viewchartbar.component';
import { TranslateService } from '@ngx-translate/core';

import { T } from '../../../../translate-marker';
 
interface DataPoint {
  usage?: number | string;
  temperature?: number | string;
  coreNumber: number;
}

@Component({
  selector: 'widget-cpu',
  templateUrl:'./widgetcpu.component.html',
  styleUrls: ['./widgetcpu.component.css']
})
export class WidgetCpuComponent extends WidgetComponent implements AfterViewInit, OnDestroy {

  @ViewChild('load', {static: true}) cpuLoad: ViewChartGaugeComponent;
  @ViewChild('cores',{static: true}) cpuCores: ViewChartBarComponent;
  @Input() data: Subject<CoreEvent>;
  public chart: any;// c3 chart with per core data
  private _cpuData: any;
  get cpuData() { return this._cpuData}
  set cpuData(value){
    this._cpuData = value;
    if(this.legendData && typeof this.legendIndex !== "undefined"){
      // C3 does not have a way to update tooltip when new data is loaded. 
      // So this is the workaround
      this.legendData[0].value = this.cpuData.data[0][this.legendIndex + 1];
      this.legendData[1].value = this.cpuData.data[1][this.legendIndex + 1];
    }
  }

  public cpuModel;
  public cpuAvg: any;
  public title:string = T("CPU");
  public subtitle:string = T("% of all cores");
  public widgetColorCssVar = "var(--accent)";
  public configurable = false;
  public chartId = UUID.UUID();
  public coreCount: number;
  public legendData: any;

  public legendColors: string[];
  private legendIndex: number;


  constructor(public router: Router, public translate: TranslateService){
    super(translate);
  }

  ngOnDestroy(){
    this.core.unregister({observerClass:this});
  }

  ngAfterViewInit(){

    this.core.register({observerClass: this, eventName:"SysInfo"}).subscribe((evt: CoreEvent) => {
      this.cpuModel = evt.data.model;
    });

    this.core.register({observerClass: this, eventName:"ThemeChanged"}).subscribe((evt: CoreEvent) => {
      d3.select('#grad1 .begin')
        .style('stop-color', this.getHighlightColor(0))

      d3.select('#grad1 .end')
        .style('stop-color', this.getHighlightColor(0.15))
    });

    this.data.subscribe((evt:CoreEvent) => {
      if(evt.name == "CpuStats"){
        //this.cpuData = evt.data;
        if(evt.data.average){
          this.setCpuLoadData(['Load', parseInt(evt.data.average.usage.toFixed(1))]);
          this.setCpuData(evt.data);
        }
      }
    });

  }

  parseCpuData(data){
    let usageColumn: any[] = ["Usage"];
    let temperatureColumn: any[] = ["Temperature"];


    // Calculate number of cores...
    let keys = Object.keys(data);

    if(!this.coreCount){
      this.coreCount = data.temperature ? keys.length - 2 : keys.length - 1;
    }
    
    for(let i = 0; i < this.coreCount; i++){
      usageColumn.push( parseInt(data[i.toString()].usage.toFixed(1)) );
      if(data.temperature && data.temperature[i]){
        temperatureColumn.push(parseInt(((data.temperature[i] / 10) - 273.05).toFixed(1)));
      }
      /*
      // JSON Approach (c3 has a bug in angular)
      let dataPoint:DataPoint = {coreNumber:i};
      dataPoint.usage = parseInt(data[i.toString()].usage.toFixed(1));
      dataPoint.temperature = data.temperature && data.temperature[i] ? parseInt(((data.temperature[i] / 10) - 273.05).toFixed(1)) : 'N/A';
      result.push(dataPoint);
      */
    }

    return [usageColumn, temperatureColumn];
    //return result;
  }

  setCpuData(/*chart,*/ data){
    let config: any = {}
    config.title = "Cores";
    config.orientation = 'horizontal';
    //config.units = "%";
    config.max = 100;
    config.data = this.parseCpuData(data);
    this.cpuData = config;
    if(!this.chart){
      this.coresChartInit();
    } else {
      this.coresChartUpdate();
    }
    //console.log(config);
  }

  setCpuLoadData(/*chart,*/ data){
    let config: any = {}
    config.title = data[0];
    config.units = "%";
    config.diameter = 136;
    config.fontSize = 24;
    config.max = 100;
    config.data = data;
    this.cpuAvg = config;
  }


  setPreferences(form:NgForm){
    let filtered: string[] = [];
    for(let i in form.value){
      if(form.value[i]){
        filtered.push(i);
      }
    }
  }

  coresChartInit(){
    let conf = {
      bindto: '#cpu-cores-chart',
      size: {
        width: 536,
        height: 140//160
      },
      tooltip:{
        show: true,
        contents: (raw, defaultTitleFormat, defaultValueFormat, color) => {
          this.legendData = raw;
          this.legendIndex = raw[0].index;
          this.hoverHighlight();
          return '<div style="display:none"></div>';
        }
      },
      legend:{
        hide:true
      },
      data: {
        onmouseout: (d) => {
          this.legendData = null;
          this.hoverHighlight(true);
          this.legendIndex = null;
        },
        colors: {
          Usage: 'var(--primary)',
          Temperature: 'var(--accent)',
        },
        columns: this.cpuData.data,
        type: 'bar'
      },
      bar: {
        width: this.coreCount < 16 ? 10 : {ratio: 0.45}
      },
      axis: {
        y: {
          max:100,
          tick: {
            values: [0,20,40,60,80,100]
          }
        },
        y2: {
          max:100,
          tick: {
            values: [0,20,40,60,80,100]
          }
        }
      },
      grid: {
        x: {
          show: false
        },
        y: {
          show:true
        }
      }
    }

    this.chart = c3.generate(conf);
      
    // setup highlight svg gradient
    let def = d3.select('#cpu-cores-chart svg defs')
      .append('linearGradient')
      .attr('id', 'grad1')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%')

    def.append('stop')
      .attr('class', 'begin')
      .attr('offset', '0%')
      .style('stop-color', this.getHighlightColor(0))
      //.style('stop-color', 'rgba(255,255,255,0)')

    def.append('stop')
      .attr('class', 'end')
      .attr('offset', '100%')
      .style('stop-color', this.getHighlightColor(0.15))
      //.style('stop-color', 'rgba(255,255,255,0.15)')

    let g = d3.select('#cpu-cores-chart svg g.c3-chart')
    g.insert('rect', ':first-child')
      .attr('class', 'c3-event-rect-highlighted')
    
    let highlightRect = d3.select('rect.c3-event-rect-highlighted')
    highlightRect.attr('class', 'active c3-event-rect-highlighted active')
      .attr('x', '-1000')
      .attr('fill', 'url(#grad1)')
  }

  getHighlightColor(opacity: number){
    // Get highlight color
    let currentTheme = this.themeService.currentTheme();
    let txtColor = currentTheme.fg2;

    // convert to rgb
    let rgb = this.themeService.hexToRGB(txtColor).rgb;

    // return rgba
    let rgba =  "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + "," + opacity + ")";

    return rgba;
  }

  colorFromTemperature(t){
    let color = "var(--green)";
    if(t.value >= 80){
      color = "var(--red)";
    } else if (t.value < 80 && t.value > 63){
      color = "var(--yellow)";
    } else if(t.value < 64){
      color = "var(--green)";
    }
    return color;
  }

  coresChartUpdate(){
    this.chart.load({
        columns: this.cpuData.data,
    });
  }

  hoverHighlight(remove?: boolean){
    let eventRect = d3.select('rect.c3-event-rect-' + this.legendIndex)
    let highlightRect = d3.select('rect.c3-event-rect-highlighted')
    // Remove fill attributes from all event rects
    // if this just a removal only, skip highlight
    if(remove){
        highlightRect.attr('y', '10000');
      return;
    }

    // highlight chosen rect
    highlightRect.attr('x', eventRect.attr('x'))
      .attr('y', eventRect.attr('y'))
      .attr('width', eventRect.attr('width'))
      .attr('height', eventRect.attr('height'))
  }
  

}
