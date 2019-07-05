import { Component, AfterViewInit, Input, ViewChild, OnDestroy } from '@angular/core';
import { CoreServiceInjector } from 'app/core/services/coreserviceinjector';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { MaterialModule } from 'app/appMaterial.module';
import { NgForm } from '@angular/forms';
import { ChartData } from 'app/core/components/viewchart/viewchart.component';
import { ViewChartDonutComponent } from 'app/core/components/viewchartdonut/viewchartdonut.component';
import { ViewChartPieComponent } from 'app/core/components/viewchartpie/viewchartpie.component';
import { ViewChartLineComponent } from 'app/core/components/viewchartline/viewchartline.component';

import filesize from 'filesize';
import { WidgetComponent } from 'app/core/components/widgets/widget/widget.component';

import { TranslateService } from '@ngx-translate/core';

import { T } from '../../../../translate-marker';

@Component({
  selector: 'widget-load-history',
  templateUrl:'./widgetloadhistory.component.html'
})
export class WidgetLoadHistoryComponent extends WidgetComponent implements AfterViewInit, OnDestroy {

  @ViewChild('chartLoad', { static: true}) chartLoad: ViewChartLineComponent;
  public title:string = T("System Load");

  constructor(public translate: TranslateService){
    super(translate);
  }

  ngOnDestroy(){
    this.core.emit({name:"StatsRemoveListener", data:{name:"Processes",obj:this}});
    this.core.unregister({observerClass:this});
  }

  ngAfterViewInit(){
    this.core.emit({ name:"StatsAddListener", data:{name:"Processes", key:"processes", obj:this} });

    this.core.register({observerClass:this,eventName:"StatsProcesses"}).subscribe((evt:CoreEvent) => {
      //DEBUG: console.log(evt);
      this.setChartData(evt);
    });

    this.core.register({observerClass:this,eventName:"StatsLoadAvgData"}).subscribe((evt:CoreEvent) => {
      //DEBUG: console.log(evt);
      //this.setChartData(evt);
    });

    this.core.register({observerClass:this, eventName:"ThemeChanged"}).subscribe(() => {
      this.chartLoad.refresh();
    });

    //this.core.emit({name:"StatsLoadAvgRequest", data:[["state-blocked", "state-sleeping", "state-wait", "state-stopped", "state-zombies", "state-running"],{step:'10', start:'now-10m'}]});
  }

  setChartData(evt:CoreEvent){
    //DEBUG: console.log("SET LOAD AVG DATA");
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
        chartData.data.push(evt.data.data[i][index]);
      }
      parsedData.push(chartData);
    }

     this.chartLoad.chartType = 'area-spline';
     this.chartLoad.units = 'm';
     this.chartLoad.timeSeries = true;
     this.chartLoad.timeFormat = '%H:%M';// eg. %m-%d-%Y %H:%M:%S.%L
     this.chartLoad.timeData = evt.data.meta;
     this.chartLoad.data = parsedData;//[cpuUser];
     this.chartLoad.width = this.chartSize;
     this.chartLoad.height = this.chartSize;
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
