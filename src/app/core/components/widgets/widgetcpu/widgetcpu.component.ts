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
//import { WidgetComponent } from 'app/core/components/widgets/widget/widget.component';
import { WidgetChartComponent, TimeData } from 'app/core/components/widgets/widgetchart/widgetchart.component';
import { ViewChartGaugeComponent } from 'app/core/components/viewchartgauge/viewchartgauge.component';
import { ViewChartBarComponent } from 'app/core/components/viewchartbar/viewchartbar.component';
import { TranslateService } from '@ngx-translate/core';

import { T } from '../../../../translate-marker';

@Component({
  selector: 'widget-cpu',
  templateUrl:'./widgetcpu.component.html',
  styleUrls: ['./widgetcpu.component.css']
})
export class WidgetCpuComponent extends WidgetChartComponent implements AfterViewInit, OnDestroy {

  @ViewChild('load') cpuLoad: ViewChartGaugeComponent;
  @ViewChild('cores') cpuCores: ViewChartBarComponent;
  @Input() data: Subject<CoreEvent>;
  public cpuData: any;
  public cpuAvg: any;
  public title:string = T("CPU");
  public subtitle:string = T("% of all cores");
  public widgetColorCssVar = "var(--accent)";
  public configurable = false;

  constructor(public router: Router, public translate: TranslateService){
    super(router, translate);
  }

  ngOnDestroy(){
    this.core.unregister({observerClass:this});
  }

  ngAfterViewInit(){
    //this.core.emit({name:"", sender:this });
    /*this.core.register({observerClass:this,eventName:"StatsCpuAggregateAverage"}).subscribe((evt:CoreEvent) => {
      this.setChartData(evt);

    });*/

    this.data.subscribe((evt:CoreEvent) => {
      if(evt.name == "CpuStats"){
        //this.cpuData = evt.data;
        if(evt.data.average /*&& typeof this.cpuLoad !== 'undefined'*/){
          console.log(evt);
          this.setCpuLoadData(this.cpuLoad, ['Load', parseInt(evt.data.average.usage.toFixed(1))]);
          this.setCpuData(this.cpuData, evt.data);
        }
      }
    });
    //this.setCpuLoadData(this.cpuLoad, ['Load', 64]);

  }

  parseCpuData(data){
    // Combine per core cpu usage and temp into 
    // a single array that the chart can consume
    
    let usageData = {
      name: "Usage",
      dataPoints: []
    }
    
    //if(data.temperature){
      let temperatureData = {
        name: "Temperatures",
        dataPoints: []
      }
    //}

    // Calculate number of cores...
    let keys = Object.keys(data);
    let coreCount = data.temperature ? keys.length - 2 : keys.length - 1;
    console.log("core count = " + coreCount);
    for(let i = 0; i < coreCount; i++){
      usageData.dataPoints.push(parseInt(data[i.toString()].usage.toFixed(1)));
      if(data.temperature){
        //temperatureData.dataPoints.push(data[i].usage);
      }
    }

    let result = [usageData];

    if(temperatureData.dataPoints.length > 0){
      result.push(temperatureData);
    }

    return result;
  }

  setCpuData(chart, data){
    let config: any = {}
    config.title = "Cores";
    //config.units = "%";
    config.max = 100;
    config.data = this.parseCpuData(data);
    this.cpuData = config;
    console.log(config);
  }

  setCpuLoadData(chart, data){
    let config: any = {}
    config.title = data[0];
    config.units = "%";
    config.diameter = 140;
    config.fontSize = 24;
    config.max = 100;
    //config.width = 184;
    //config.height = 225;
    config.data = data;
    this.cpuAvg = config;

    /*chart.title = data[0];
    chart.units = "%";
    chart.max = 100;
    chart.width = 600;
    chart.height = 225;*/
    //chart.data = [{legend: data[0], value: [data[1]]}
    //chart.data = data; 
    //this.cpuAvg = data;
  }


  setPreferences(form:NgForm){
    let filtered: string[] = [];
    for(let i in form.value){
      if(form.value[i]){
        filtered.push(i);
      }
    }
  }

}
