import { Component, AfterViewInit, Input, ViewChild, OnDestroy} from '@angular/core';
import { DomSanitizer, SafeHtml, SafeStyle, SafeScript, SafeUrl, SafeResourceUrl } from '@angular/platform-browser';
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
  selector: 'widget-memory',
  templateUrl:'./widgetmemory.component.html',
  styleUrls: ['./widgetmemory.component.css']
})
export class WidgetMemoryComponent extends WidgetComponent implements AfterViewInit, OnDestroy {


  @ViewChild('memorygauge', {static: true}) cpuLoad: ViewChartGaugeComponent;
  @ViewChild('cores',{static: true}) cpuCores: ViewChartBarComponent;
  @Input() data: Subject<CoreEvent>;
  public chart: any;// c3 chart with per core data
  private _memData: any;
  get memData() { return this._memData}
  set memData(value){
    this._memData = value;
    if(this.legendData && typeof this.legendIndex !== "undefined"){
      // C3 does not have a way to update tooltip when new data is loaded. 
      // So this is the workaround
      this.legendData[0].value = this.memData.data[0][this.legendIndex + 1];
      this.legendData[1].value = this.memData.data[1][this.legendIndex + 1];
    }
  }

  public usage: any;
  public title:string = T("Memory");
  public subtitle:string = T("% of all cores");
  public widgetColorCssVar = "var(--accent)";
  public configurable = false;
  public chartId = UUID.UUID();
  public memTotal: number;
  public legendData: any;
  public formattedData: any;
  public colorPattern:string[];

  public legendColors: string[];
  private legendIndex: number;


  constructor(public router: Router, public translate: TranslateService, private sanitizer:DomSanitizer){
    super(translate);
  }

  ngOnDestroy(){
    this.core.unregister({observerClass:this});
  }

  ngAfterViewInit(){

    /*this.core.register({observerClass: this, eventName:"ThemeChanged"}).subscribe((evt: CoreEvent) => {
      d3.select('#grad1 .begin')
        .style('stop-color', this.getHighlightColor(0))

      d3.select('#grad1 .end')
        .style('stop-color', this.getHighlightColor(0.15))
    });*/

    this.data.subscribe((evt:CoreEvent) => {
      console.log(evt);
      if(evt.name == "MemoryStats"){
        console.log("MemoryStats!!!");
        //this.cpuData = evt.data;
        if(evt.data.used){
          //const converted = this.bytesToGigabytes(evt.data.used);
          //this.setUsageData(['Used', parseInt(converted.toFixed(1))]);
          //this.setCpuLoadData(['Load', parseInt(evt.data.average.usage.toFixed(1))]);
          //this.setUsageData(evt.data);
          this.setMemData(evt.data);
        }
      }
    });

  }

  bytesToGigabytes(value){
    return value / 1024 / 1024 / 1024;
  }

  parseMemData(data){
    let columns = [];

    const keys = Object.keys(data);
    let clone = Object.assign({}, data);

    keys.forEach((item, index) => {
      let converted = this.bytesToGigabytes(data[item]);
      if(item == 'total' || item == 'used' || item == 'percent' || item == 'available'){ 
        return; 
      } else {
        clone[item] = converted.toFixed(1);
        columns.push([item, clone[item]])
      }
    });
    this.formattedData = clone;

    return  columns
  }

  setMemData( data){

    let config: any = {}
    config.title = "Cores";
    config.orientation = 'vertical';
    config.units = "GiB";
    config.max = this.bytesToGigabytes(data.total).toFixed(1);
    config.data = this.parseMemData(data);
    this.memData = config;
    if(!this.chart){
      this.memChartInit();
    } else {
      this.memChartUpdate();
    }
    console.log(config);
  }

  setUsageData( data){
    const keys = Object.keys(data);
    let clone = Object.assign({}, data);

    keys.forEach((item, index) => {
      let converted = this.bytesToGigabytes(data[item]);
      //clone[item] = parseInt(converted.toFixed(1));
      clone[item] = converted.toFixed(1);
    });

    let config: any = {};
    config.title = "Used";
    config.units = "GiB";
    config.diameter = 136;
    config.fontSize = 24;
    config.max = 100;
    config.data = ["Used",clone.used];
    this.usage = config;
    console.log(clone);
    console.log(this.usage);
  }


  setPreferences(form:NgForm){
    let filtered: string[] = [];
    for(let i in form.value){
      if(form.value[i]){
        filtered.push(i);
      }
    }
  }

  memChartInit(){

    let currentTheme = this.themeService.currentTheme();
    this.colorPattern = currentTheme.accentColors.map((hue) => {
      return 'var(--' + hue + ')';
    })

    let conf = {
      bindto: '#memory-usage-chart',
      size: {
        width: 400,
        height:64
      },
      tooltip:{
        show: false,
      },
      legend:{
        show:false
      },
      color:{
        pattern: this.colorPattern
      },
      data: {
        /*onmouseout: (d) => {
          this.legendData = null;
          //this.hoverHighlight(true);
          this.legendIndex = null;
        },*/
        colors: {
          Usage: 'var(--primary)',
          Temperature: 'var(--accent)',
        },
        columns: this.memData.data,
        type: 'bar',
        groups: [
          ['free','active','inactive','buffers','cached','shared','wired']
        ]
      },
      bar: {
        //width: 400//this.coreCount < 16 ? 10 : {ratio: 0.45}
      },
      axis: {
        rotated:true,
        x:{ show: false },
        y:{ show: false }
      },
      /*grid: {
        x: {
          show: false
        },
        y: {
          show:true
        }
      }*/
    }

    this.chart = c3.generate(conf);
      
    // setup highlight svg gradient
    /*let def = d3.select('#cpu-cores-chart svg defs')
      .append('linearGradient')
      .attr('id', 'grad1')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%')

    def.append('stop')
      .attr('class', 'begin')
      .attr('offset', '0%')
      //.style('stop-color', this.getHighlightColor(0))
      //.style('stop-color', 'rgba(255,255,255,0)')

    def.append('stop')
      .attr('class', 'end')
      .attr('offset', '100%')
      //.style('stop-color', this.getHighlightColor(0.15))
      //.style('stop-color', 'rgba(255,255,255,0.15)')

    let g = d3.select('#cpu-cores-chart svg g.c3-chart')
    g.insert('rect', ':first-child')
      .attr('class', 'c3-event-rect-highlighted')
    
    let highlightRect = d3.select('rect.c3-event-rect-highlighted')
    highlightRect.attr('class', 'active c3-event-rect-highlighted active')
      .attr('x', '-1000')
      .attr('fill', 'url(#grad1)')*/
  }

  /*getHighlightColor(opacity: number){
    // Get highlight color
    let currentTheme = this.themeService.currentTheme();
    let txtColor = currentTheme.fg2;

    // convert to rgb
    let rgb = this.themeService.hexToRGB(txtColor).rgb;

    // return rgba
    let rgba =  "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + "," + opacity + ")";

    return rgba;
  }*/

  /*colorFromTemperature(t){
    let color = "var(--green)";
    if(t.value >= 80){
      color = "var(--red)";
    } else if (t.value < 80 && t.value > 63){
      color = "var(--yellow)";
    } else if(t.value < 64){
      color = "var(--green)";
    }
    return color;
  }*/

  memChartUpdate(){
    this.chart.load({
        columns: this.memData.data,
    });
  }

   trustedSecurity(style) {
      return this.sanitizer.bypassSecurityTrustStyle(style);
   }

  /*hoverHighlight(remove?: boolean){
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
  }*/
  

}
