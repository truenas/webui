import { Component,OnDestroy, AfterViewInit, ViewChild, Input } from '@angular/core';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { ChartData } from 'app/core/components/viewchart/viewchart.component';
import { ViewChartDonutComponent } from 'app/core/components/viewchartdonut/viewchartdonut.component';
import { ViewChartLineComponent } from 'app/core/components/viewchartline/viewchartline.component';

@Component({
  selector: 'vm-summary',
  templateUrl: './vm-summary.component.html',
  styleUrls: ['./vm-summary.component.css']
})
export class VmSummaryComponent implements AfterViewInit, OnDestroy {

  @ViewChild('cpu', { static: true}) cpuChart:ViewChartLineComponent;
  @ViewChild('zpool', { static: true}) zpoolChart:ViewChartDonutComponent;
  @ViewChild('mem', { static: true}) memChart:ViewChartDonutComponent;
  @Input() virtualMachines;
  public chartSize:number = 260;
  public totalVmem:number;
  public physmem:number;

  constructor(private core:CoreService) {
  }

  ngAfterViewInit() {

    this.core.register({observerClass:this,eventName:"PoolData"}).subscribe((evt:CoreEvent) => {
      //console.log(evt);
      this.setPoolData(evt);
    });

    this.core.register({observerClass:this,eventName:"VmProfiles"}).subscribe((evt:CoreEvent) => {
      //console.log(evt);
      this.core.emit({name:"StatsVmemoryUsageRequest"});
    });

    this.core.register({observerClass:this,eventName:"VmStarted"}).subscribe((evt:CoreEvent) => {
      //console.log(evt);
      this.core.emit({name:"StatsVmemoryUsageRequest"});
    });

    this.core.register({observerClass:this,eventName:"VmStopped"}).subscribe((evt:CoreEvent) => {
      //console.log(evt);
      this.core.emit({name:"StatsVmemoryUsageRequest"});
    });

    this.core.register({observerClass:this,eventName:"StatsCpuData"}).subscribe((evt:CoreEvent) => {
      //console.log(evt);
      this.setCPUData(evt);
      //this.setNetData(evt);
    });

    this.core.register({observerClass:this,eventName:"StatsVmemoryUsage"}).subscribe((evt:CoreEvent) => {
      //console.log(evt);
      this.setMemData(evt);
    });

    this.core.register({observerClass:this,eventName:"SysInfo"}).subscribe((evt:CoreEvent) => {
      //console.log(evt);
      this.setMemTotal(evt);
    });

    this.core.register({observerClass:this,eventName:"ThemeChanged"}).subscribe((evt:CoreEvent) => {
      if (this.cpuChart){
        this.cpuChart.refresh();
      }
      if (this.zpoolChart){
        this.zpoolChart.refresh();
      }
      if (this.memChart){
        this.memChart.refresh();
      }
    });

    // Pool Stats
    this.core.emit({name:"PoolDataRequest"});

    // VM Memory Usage Stats
    this.core.emit({name:"StatsVmemoryUsageRequest"});
    this.core.emit({name:"SysInfoRequest"});

    // CPU Stats (dataList eg. {source: "aggregation-cpu-sum", type: "cpu-user", dataset: "value"})
    //this.core.emit({name:"StatsCpuRequest", data:[['user','interrupt','system'/*,'idle','nice'*/],{step:'10', start:'now-10m'}]});

   }

  ngOnDestroy(){
    this.core.unregister({observerClass:this});
  }

  setMemData(evt:CoreEvent){
    this.memChart.title = "vMemory in Use";
    this.memChart.units="GiB";
    this.memChart.legendPosition = "right";

    // Convert to GiB
    let RNP = (<any>window).filesize(evt.data.RNP, {output: "object", exponent:3});
    let PRD = (<any>window).filesize(evt.data.PRD, {output: "object", exponent:3});
    let RPRD = (<any>window).filesize(evt.data.RPRD, {output: "object", exponent:3});

    let memData = [
      {legend: 'Running (unprovisioned)', data:[RNP.value]},
      {legend: 'Stopped (provisioned)', data:[PRD.value]},
      {legend: 'Running (provisioned)', data:[RPRD.value]}
    ];
    this.totalVmem = evt.data.RNP + evt.data.PRD + evt.data.RPRD;
    if(this.physmem){
      //console.warn({physmem:this.physmem, totalVmem: this.totalVmem});
      let avail = (<any>window).filesize(this.physmem - this.totalVmem, {output: "object", exponent:3});
      memData.push({legend:"Free", data:[avail.value]});
    }
    this.memChart.data = memData;

    this.memChart.width = this.chartSize;
    this.memChart.height = this.chartSize;
    //this.memChart.refresh();
  }
  setMemTotal(evt:CoreEvent){
    let totalMem = (<any>window).filesize(evt.data.physmem, {output: "object", exponent:3});

    if(this.totalVmem){
      this.memChart.data.push({legend:"Free",data:[ totalMem.value - this.totalVmem]});
      //this.memChart.refresh();
    } else {
      this.physmem = evt.data.physmem;
    }
  }

  setPoolData(evt:CoreEvent){
    let usedObj = (<any>window).filesize(evt.data[0].used, {output: "object", exponent:3});
    /*let used: ChartData = {
      legend: 'Used',
      data: [usedObj.value]
    };

    let  availableObj = (<any>window).filesize(evt.data[0].avail, {output: "object", exponent:3});
    let available: ChartData = {
      legend:'Available',
      data: [availableObj.value]
    };

    this.zpoolChart.units = 'GiB';
    this.zpoolChart.title = 'Zpool';
    this.zpoolChart.data = [used,available];
    //console.log(this.zpoolChart.data);
    this.zpoolChart.width = this.chartSize;
    this.zpoolChart.height = this.chartSize;*/
  }

  setCPUData(evt:CoreEvent){
    //console.log("SET CPU DATA");
    //console.log(evt.data);
    /*let cpuUserObj = evt.data;

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

    this.cpuChart.chartType = 'line';
    this.cpuChart.units = '%';
    this.cpuChart.timeSeries = true;
    this.cpuChart.timeFormat = '%H:%M';// eg. %m-%d-%Y %H:%M:%S.%L
    this.cpuChart.timeData = evt.data.meta;
    this.cpuChart.data = parsedData;//[cpuUser];
    this.cpuChart.width = this.chartSize;
    this.cpuChart.height = this.chartSize;*/
  }
}
