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
import { TranslateService } from '@ngx-translate/core';

import { T } from '../../../../translate-marker';

@Component({
  selector: 'widget-cpu',
  templateUrl:'./widgetcpu.component.html',
  styleUrls: ['./widgetcpu.component.css']
})
export class WidgetCpuComponent extends WidgetChartComponent implements AfterViewInit, OnDestroy {

  @ViewChild('load') cpuLoad: ViewChartGaugeComponent;
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
          this.setCpuLoadData(this.cpuLoad, ['Load', parseInt(evt.data.average.usage.toFixed(1))]);
        }
      }
    });
    //this.setCpuLoadData(this.cpuLoad, ['Load', 64]);

  }

  setCpuLoadData(chart, data){
    let config: any = {}
    config.title = data[0];
    config.units = "%";
    config.max = 100;
    config.width = 184;
    config.height = 225;
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
