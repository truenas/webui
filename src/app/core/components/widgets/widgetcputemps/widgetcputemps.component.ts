import { Component, OnInit, AfterViewInit, Input, ViewChild, OnDestroy} from '@angular/core';
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
import { TranslateService } from '@ngx-translate/core';

import { T } from '../../../../translate-marker';

@Component({
  selector: 'widget-cpu-temps',
  templateUrl:'./widgetcputemps.component.html'
})
export class WidgetCpuTempsComponent extends WidgetComponent implements OnInit, OnDestroy {

  @ViewChild('chartCpu') chartCpu: ViewChartLineComponent;
  public title:string = T("CPU Temperatures");
  public aggregateTemps = {};
  private _cores: number;

  get cores(){
    return this._cores;
  }

  set cores(val){
    console.log("SETTING CORES");
    this._cores = val;
    this.registerObservers(val);
  }

  constructor(public translate: TranslateService){
    super(translate);
    //this.cores = 4;
  }

  ngOnDestroy(){
    this.core.emit({name:"StatsRemoveListener", data:{name:"CpuTemp", obj:this}});
  }

  ngOnInit(){
    this.core.emit({name:"SysInfoRequest"});
    this.core.register({observerClass:this,eventName:"SysInfo"}).subscribe((evt:CoreEvent) => {
      //DEBUG: console.log(evt);
      //this.setCPUData(evt);
      if(this.cores !== evt.data.cores){
        this.cores = evt.data.cores;
        console.log(this.cores);
        this.core.emit({name:"StatsAddListener", data:{name:"CpuTemp", obj:this} });
      }
    });

    /*this.core.register({observerClass:this,eventName:"StatsCpuAggregateSum"}).subscribe((evt:CoreEvent) => {
      //DEBUG: console.log(evt);
      this.setCPUData(evt);
    });*/

    this.core.register({observerClass:this, eventName:"ThemeChanged"}).subscribe(() => {
      this.chartCpu.refresh();
    });

  }

  registerObservers(cores){
    for(let i = 0; i < cores; i++){
      this.core.register({observerClass:this,eventName:"StatsCpuTemp" + i}).subscribe((evt:CoreEvent) => {
        console.log(evt);
        //this.setCPUData(evt);
        this.aggregateData(i, evt.data);
      });
    }
  }
  
  aggregateData(cpu, data){
    let keys = Object.keys(this.aggregateTemps);
    let temps = data.data.map( value => value/100);
    if(keys.length == (this.cores - 1) && !this.aggregateTemps["cpu-" + cpu]){
      this.aggregateTemps["cpu-" + cpu] = temps;
      console.log("AGGREGATION RESET!!");
      this.setCPUData(this.aggregateTemps, data.meta);
      this.aggregateTemps = {};
    } else if(keys.length < this.cores && !this.aggregateTemps["cpu-" + cpu]){
      this.aggregateTemps["cpu-" + cpu] = temps;
    }
  }

  setCPUData(data, meta){
    //DEBUG: console.log("SET CPU DATA");
    //DEBUG: console.log(evt.data);
    //let cpuUserObj = evt.data;

    let parsedData = [];
    let dataTypes = [];
    dataTypes = Object.keys(data);//evt.data.meta.legend;

    for(let index in dataTypes){
      let chartData:ChartData = {
        legend: dataTypes[index],
        data:[]
      }
      for(let i in /*evt.data.*/data){
        chartData.data.push(/*evt.data.*/data[i][index])
      }
      parsedData.push(chartData);
    }

     this.chartCpu.chartType = 'area-spline';
     this.chartCpu.units = '°';
     this.chartCpu.timeSeries = true;
     this.chartCpu.timeFormat = '%H:%M';// eg. %m-%d-%Y %H:%M:%S.%L
     this.chartCpu.timeData = /*evt.data.*/meta;
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
