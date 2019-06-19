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

    this.data.subscribe((evt:CoreEvent) => {
      if(evt.name == "MemoryStats"){
        if(evt.data.used){
          this.setMemData(evt.data);
        }
      }
    });

  }

  bytesToGigabytes(value){
    return value / 1024 / 1024 / 1024;
  }

  parseMemData(data){
    console.log(data);
    let services = this.aggregate([
      data["active"],
      data["shared"],
      data["cached"],
      data["buffers"],
      data["inactive"],
    ]);

    let columns = [
      [ "Free", this.bytesToGigabytes(data["free"]).toFixed(1)],
      [ "ZFS Cache", this.bytesToGigabytes(data["wired"]).toFixed(1)],
      [ "Services", this.bytesToGigabytes(services).toFixed(1)]
    ];

    return  columns
  }

  aggregate(data){
    return data.reduce((total, num) => total + num);
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
    this.colorPattern = ["var(--green)", "var(--primary)", "var(--accent)"];

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
        colors: {
          Usage: 'var(--primary)',
          Temperature: 'var(--accent)',
        },
        columns: this.memData.data,
        type: 'bar',
        groups: [
          ["Free", "ZFS Cache", "Services"]
        ]
      },
      axis: {
        rotated:true,
        x:{ show: false },
        y:{ show: false }
      },
    }

    this.chart = c3.generate(conf);
      
  }

  memChartUpdate(){
    this.chart.load({
        columns: this.memData.data,
    });
  }

   trustedSecurity(style) {
      return this.sanitizer.bypassSecurityTrustStyle(style);
   }

}
