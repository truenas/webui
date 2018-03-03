import { Component, AfterViewInit, Input, ViewChild } from '@angular/core';
import { CoreServiceInjector } from 'app/core/services/coreserviceinjector';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { MaterialModule } from 'app/appMaterial.module';
import { NgForm } from '@angular/forms';
import { ChartData } from 'app/core/components/viewchart/viewchart.component';
import { ViewChartDonutComponent } from 'app/core/components/viewchartdonut/viewchartdonut.component';
import { ViewChartPieComponent } from 'app/core/components/viewchartpie/viewchartpie.component';
import { ViewChartLineComponent } from 'app/core/components/viewchartline/viewchartline.component';
import { AnimationDirective } from 'app/core/directives/animation.directive';
import filesize from 'filesize';
import { WidgetComponent } from 'app/core/components/widgets/widget/widget.component';

@Component({
  selector: 'widget-memory-history',
  templateUrl:'./widgetmemoryhistory.component.html'
})
export class WidgetMemoryHistoryComponent extends WidgetComponent implements AfterViewInit {

  @ViewChild('chartMem') chartMem: ViewChartLineComponent;
  public title:string = "Memory Usage";

  constructor(){
    super();
  }

  ngAfterViewInit(){
    this.core.register({observerClass:this,eventName:"StatsMemoryData"}).subscribe((evt:CoreEvent) => {
      console.log(evt);
      this.setChartData(evt);
    });

    this.core.register({observerClass:this, eventName:"ThemeChanged"}).subscribe(() => {
      this.chartMem.refresh();
    });

    this.core.emit({name:"StatsMemoryRequest", data:[['free','active','cache','wired','inactive'],{step:'10', start:'now-10m'}]});
  }

  setChartData(evt:CoreEvent){
    console.log("SET MEMORY DATA");
    console.log(evt.data);
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
