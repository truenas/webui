import { Component, AfterViewInit, Input, ViewChild, OnDestroy} from '@angular/core';
import { CoreServiceInjector } from '../../../services/coreserviceinjector';
import { CoreService, CoreEvent } from '../../../services/core.service';
import { MaterialModule } from '../../../../appMaterial.module';
import { NgForm } from '@angular/forms';
import { ChartData } from '../../viewchart/viewchart.component';
import { ViewChartDonutComponent } from '../../viewchartdonut/viewchartdonut.component';
import { ViewChartPieComponent } from '../../viewchartpie/viewchartpie.component';
import { ViewChartLineComponent } from '../../viewchartline/viewchartline.component';
import { AnimationDirective } from '../../../directives/animation.directive';
import filesize from 'filesize';
import { WidgetComponent } from '../widget/widget.component';

import { TranslateService } from '@ngx-translate/core';

import { T } from '../../../../translate-marker';

@Component({
  selector: 'widget-memory-history',
  templateUrl:'./widgetmemoryhistory.component.html'
})
export class WidgetMemoryHistoryComponent extends WidgetComponent implements AfterViewInit,OnDestroy {

  @ViewChild('chartMem') chartMem: ViewChartLineComponent;
  public title:string = T("Memory Usage");

  constructor(public translate: TranslateService){
    super(translate);
  }

  ngOnDestroy(){
    this.core.emit({name:"StatsRemoveListener", data:{name:"Memory", obj:this}});
  }

  ngAfterViewInit(){
    this.core.emit({name:"StatsAddListener", data:{name:"Memory", key:"memory", obj:this}});

    this.core.register({observerClass:this,eventName:"StatsMemory"}).subscribe((evt:CoreEvent) => {
      this.setChartData(evt);
    });

    this.core.register({observerClass:this,eventName:"StatsMemoryData"}).subscribe((evt:CoreEvent) => {
      //DEBUG: console.log(evt);
      //this.setChartData(evt);
    });

    this.core.register({observerClass:this, eventName:"ThemeChanged"}).subscribe(() => {
      this.chartMem.refresh();
    });

    //this.core.emit({name:"StatsMemoryRequest", data:[['free','active','cache','wired','inactive'],{step:'10', start:'now-10m'}]});
  }

  setChartData(evt:CoreEvent){
    //DEBUG: console.log("SET MEMORY DATA");
    //DEBUG: console.log(evt.data);
    let memUserObj = evt.data;

    let parsedData = [];
    let dataTypes = evt.data.meta.legend;

    for(let index in dataTypes){
      let chartData:ChartData = {
        legend: dataTypes[index],
        data:[]
      }
      for(let i in evt.data.data){
        let bytes = evt.data.data[i][index];
        let gigs = bytes/1073741824;
        chartData.data.push(Number(gigs.toFixed(2)))
      }
      parsedData.push(chartData);
    }

     this.chartMem.chartType = 'area-spline';
     this.chartMem.units = 'GB';
     this.chartMem.timeSeries = true;
     this.chartMem.timeFormat = '%H:%M';// eg. %m-%d-%Y %H:%M:%S.%L
     this.chartMem.timeData = evt.data.meta;
     this.chartMem.data = parsedData;//[cpuUser];
     this.chartMem.width = this.chartSize;
     this.chartMem.height = this.chartSize;
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
