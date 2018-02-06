import { Component, AfterViewInit, Input, ViewChild } from '@angular/core';
import { CoreServiceInjector } from 'app/core/services/coreserviceinjector';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { MaterialModule } from 'app/appMaterial.module';
import { ChartData } from 'app/core/components/viewchart/viewchart.component';
import { ViewChartDonutComponent } from 'app/core/components/viewchartdonut/viewchartdonut.component';
import { ViewChartPieComponent } from 'app/core/components/viewchartpie/viewchartpie.component';
import { ViewChartLineComponent } from 'app/core/components/viewchartline/viewchartline.component';
import { AnimationDirective } from 'app/core/directives/animation.directive';
import filesize from 'filesize';

@Component({
  selector: 'widget',
  templateUrl:'./widget.component.html'
})
export class WidgetComponent implements AfterViewInit {

  protected core:CoreService;
  @Input() widgetSize: string;
  @ViewChild('chartDonut') chartDonut: ViewChartDonutComponent;// | ViewChartPieComponent;
  @ViewChild('chartCpu') chartCpu: ViewChartLineComponent;
  public title:string = "CPU History";
  public chartSize:number;
  public flipAnimation = "stop";
  public flipDirection = "vertical";
  public isFlipped: boolean = false;

  constructor(){
    this.core = CoreServiceInjector.get(CoreService);
  }

  ngAfterViewInit(){
    this.core.register({observerClass:this,eventName:"PoolData"}).subscribe((evt:CoreEvent) => {
      console.log(evt);
      this.setPoolData(evt);
      //this.animation = "stop";
      });

    this.core.register({observerClass:this,eventName:"StatsCpuData"}).subscribe((evt:CoreEvent) => {
      console.log(evt);
      this.setCPUData(evt);
    });

    this.core.register({observerClass:this, eventName:"ThemeChanged"}).subscribe(() => {
      this.chartCpu.refresh();
    });

    this.core.emit({name:"PoolDataRequest"});
    this.core.emit({name:"StatsCpuRequest", data:[['user','interrupt','system'/*,'idle','nice'*/],{step:'10', start:'now-10m'}]});
  }

  toggleConfig(){
    if(this.isFlipped){
      this.flipAnimation = "unflip";
    } else {
      this.flipAnimation = "flip"
    }

    if(this.flipDirection == "vertical"){
      this.flipAnimation += "V";
    } else if(this.flipDirection == "horizontal"){
      this.flipAnimation += "H";
    }

    this.isFlipped = !this.isFlipped;
  }

  setPoolData(evt:CoreEvent){
    let usedObj = filesize(evt.data[0].used, {output: "object", exponent:3});
    let used: ChartData = {
      legend: 'Used', 
      data: [usedObj.value]
    };

    let  availableObj = filesize(evt.data[0].avail, {output: "object", exponent:3});
    let available: ChartData = {
      legend:'Available', 
      data: [availableObj.value]
    };

    this.chartDonut.units = 'GB';
    this.chartDonut.title = 'Zpool';
    this.chartDonut.data = [used,available];
    console.log(this.chartDonut.data);
    this.chartDonut.width = this.chartSize;
    this.chartDonut.height = this.chartSize;
  }

  setCPUData(evt:CoreEvent){
    console.log("SET CPU DATA");
    console.log(evt.data);
    let cpuUserObj = evt.data;

    let parsedData = [];
    let dataTypes = evt.data.meta.legend;

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


    /*
     *  let cpuUser: ChartData = {
     *    legend: 'CPU',
     *    data: evt.data.data
     *  }
     **/

     this.chartCpu.chartType = 'line';
     this.chartCpu.units = '%';
     this.chartCpu.timeSeries = true;
     this.chartCpu.timeFormat = '%H:%M';// eg. %m-%d-%Y %H:%M:%S.%L
     this.chartCpu.timeData = evt.data.meta;
     this.chartCpu.data = parsedData;//[cpuUser];
     this.chartCpu.width = this.chartSize;
     this.chartCpu.height = this.chartSize;
  }


}
