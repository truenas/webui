import { Component, OnInit, AfterViewInit, Input, ViewChild, OnDestroy} from '@angular/core';
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
  selector: 'widget-cpu-temps',
  templateUrl:'./widgetcputemps.component.html'
})
export class WidgetCpuTempsComponent extends WidgetComponent implements AfterViewInit, OnDestroy {

  @ViewChild('chartCpu') chartCpu: ViewChartLineComponent;
  public title:string = T("CPU Temperatures");
  public aggregateTemps = {};
  public aggregateMeta = {};
  private _cores: number;

  get cores(){
    return this._cores;
  }

  set cores(val){
    this._cores = val;
    this.registerObservers(val);
  }

  constructor(public translate: TranslateService){
    super(translate);
    //this.cores = 8;
  }

  ngOnDestroy(){
    this.core.emit({name:"StatsRemoveListener", data:{name:"CpuTemp", obj:this}});
  }

  ngAfterViewInit(){
    this.core.emit({name:"SysInfoRequest"});
    this.core.emit({name:"StatsAddListener", data:{name:"CpuTemp", obj:this} });
    this.core.register({observerClass:this,eventName:"SysInfo"}).subscribe((evt:CoreEvent) => {
      //DEBUG: console.log(evt);
      //this.setCPUData(evt);
      if(this.cores !== evt.data.cores){
        this.cores = evt.data.cores;
      }
    });

    this.core.register({observerClass:this, eventName:"ThemeChanged"}).subscribe(() => {
      this.chartCpu.refresh();
    });

  }

  registerObservers(cores){
    for(let i = 0; i < cores; i++){
      this.core.register({observerClass:this,eventName:"StatsCpuTemp" + i}).subscribe((evt:CoreEvent) => {
        this.aggregateData(i, evt.data);
      });
    }
  }
  
  aggregateData(cpu, data){
    let keys = Object.keys(this.aggregateTemps);
    let metaKeys = Object.keys(this.aggregateMeta);

    let temps = data.data.map( value => value/100);

    if(keys.length == (this.cores - 1) && !this.aggregateTemps["cpu-" + cpu]){
      this.aggregateTemps["cpu-" + cpu] = temps;
      this.setCPUData(this.aggregateTemps, this.aggregateMeta);
      this.aggregateTemps = {};
      this.aggregateMeta = {};
    } else if(keys.length < this.cores && !this.aggregateTemps["cpu-" + cpu]){
      this.aggregateTemps["cpu-" + cpu] = temps;
      if(metaKeys.length == 0){
        this.aggregateMeta = data.meta;
      }
    }
  }

  setCPUData(data, meta){

    let parsedData = [];
    let keys = Object.keys(data);
    for(let i = 0; i < keys.length; i++){

      let chartData:ChartData = {
        legend:"CPU " + i,
        data: data["cpu-" + i]
      }
      parsedData.push(chartData);
    }

     this.chartCpu.chartType = 'spline';
     this.chartCpu.units = '°';
     //this.chartCpu.max = 100; // Uncomment this to set a static max to y axis
     this.chartCpu.timeSeries = true;
     this.chartCpu.timeFormat = '%H:%M';// eg. %m-%d-%Y %H:%M:%S.%L
     this.chartCpu.timeData = meta;
     this.chartCpu.data = parsedData;
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
