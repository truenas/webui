import { Component, AfterViewInit, Input, ViewChild, OnDestroy} from '@angular/core';
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
  selector: 'widget-cpu-history',
  templateUrl:'./widgetcpuhistory.component.html'
})
export class WidgetCpuHistoryComponent extends WidgetComponent implements AfterViewInit, OnDestroy {

  @ViewChild('chartCpu') chartCpu: ViewChartLineComponent;
  public title:string = "CPU History";

  constructor(){
    super();
  }

  ngOnDestroy(){
    this.core.emit({name:"StatsRemoveListener", data:{name:"CpuAggregate", obj:this}});
  }

  ngAfterViewInit(){
    this.core.emit({name:"StatsAddListener", data:{name:"CpuAggregate",key:"sum", obj:this} });
    this.core.register({observerClass:this,eventName:"StatsCpuData"}).subscribe((evt:CoreEvent) => {
      //DEBUG: console.log(evt);
      //this.setCPUData(evt);
    });

    this.core.register({observerClass:this,eventName:"StatsCpuAggregateSum"}).subscribe((evt:CoreEvent) => {
      //DEBUG: console.log(evt);
      this.setCPUData(evt);
    });

    this.core.register({observerClass:this, eventName:"ThemeChanged"}).subscribe(() => {
      this.chartCpu.refresh();
    });

    //this.core.emit({name:"StatsCpuRequest", data:[['user','interrupt','system'/*,'idle','nice'*/],{step:'10', start:'now-10m'}]});
  }

  setCPUData(evt:CoreEvent){
    //DEBUG: console.log("SET CPU DATA");
    //DEBUG: console.log(evt.data);
    let cpuUserObj = evt.data;

    let parsedData = [];
    let dataTypes = [];
    dataTypes = evt.data.meta.legend;

    for(let index in dataTypes){
      let chartData:ChartData = {
        legend: dataTypes[index],
        data:[]
      }
      for(let i in evt.data.data){
        chartData.data.push(evt.data.data[i][index])
      }
      parsedData.push(chartData);
    }

     this.chartCpu.chartType = 'area-spline';
     this.chartCpu.units = '%';
     this.chartCpu.timeSeries = true;
     this.chartCpu.timeFormat = '%H:%M';// eg. %m-%d-%Y %H:%M:%S.%L
     this.chartCpu.timeData = evt.data.meta;
     this.chartCpu.data = parsedData;//[cpuUser];
     this.chartCpu.width = this.chartSize;
     this.chartCpu.height = this.chartSize;
     this.chartCpu.refresh();
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
