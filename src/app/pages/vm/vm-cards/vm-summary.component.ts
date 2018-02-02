import { Component, AfterViewInit, ViewChild, Input } from '@angular/core';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { ChartData } from 'app/core/components/viewchart/viewchart.component';
import { ViewChartPieComponent } from 'app/core/components/viewchartpie/viewchartpie.component';
import { ViewChartGaugeComponent } from 'app/core/components/viewchartgauge/viewchartgauge.component';
import { ViewChartDonutComponent } from 'app/core/components/viewchartdonut/viewchartdonut.component';
import { ViewChartLineComponent } from 'app/core/components/viewchartline/viewchartline.component';
import { Subject } from 'rxjs/Subject';

@Component({
  selector: 'vm-summary',
  templateUrl: './vm-summary.component.html',
  styleUrls: ['./vm-summary.component.css']
})
export class VmSummaryComponent implements AfterViewInit {

  @ViewChild('cpu') cpuChart:ViewChartLineComponent;
  @ViewChild('zpool') zpoolChart:ViewChartDonutComponent;
  @ViewChild('net') netChart:ViewChartGaugeComponent;
  @Input() virtualMachines;
  public chartSize:number = 260;

  constructor(private core:CoreService) {
  }

  ngAfterViewInit() {

    this.core.register({observerClass:this,eventName:"PoolData"}).subscribe((evt:CoreEvent) => {
      console.log(evt);
      this.setPoolData(evt);
    });

    this.core.register({observerClass:this,eventName:"StatsCpuData"}).subscribe((evt:CoreEvent) => {
      console.log(evt);
      this.setCPUData(evt);
      this.setNetData(evt);
    });

    // Pool Stats
    this.core.emit({name:"PoolDataRequest"});
    // CPU Stats (dataList eg. {source: "aggregation-cpu-sum", type: "cpu-user", dataset: "value"})
    //let dataList = [{source: "aggregation-cpu-sum", type: "cpu-user", dataset: "value"}];
    //this.core.emit({name:"StatsRequest", data:[dataList,{step:'10', start:'now-10m'}]});
    this.core.emit({name:"StatsCpuRequest", data:[['user','interrupt','system'/*,'idle','nice'*/],{step:'10', start:'now-10m'}]});

    /*this.cpuChart.data = [
     {legend: 'CPU Load', data:[10,50,60,95,15,30,45,55,35,79,95,60,80,15,250,125,1024,670,220,450,75]},
    ];
    this.cpuChart.width = this.chartSize;
    this.cpuChart.height = this.chartSize;
    */



   }

  setNetData(evt:CoreEvent){
    this.netChart.data = [
      //{legend: 'C', data:[10]},
      {legend: 'D', data:[90]}
    ];
    this.netChart.width = this.chartSize;
    this.netChart.height = this.chartSize;
  }

  // rest.get('storage/volume/', {}).subscribe((res) => {});
  setPoolData(evt:CoreEvent){
    let usedObj = (<any>window).filesize(evt.data[0].used, {output: "object", exponent:3});
    let used: ChartData = {
      legend: 'Used', 
      data: [usedObj.value]
    };

    let  availableObj = (<any>window).filesize(evt.data[0].avail, {output: "object", exponent:3});
    let available: ChartData = {
      legend:'Available', 
      data: [availableObj.value]
    };

    this.zpoolChart.units = 'GB';
    this.zpoolChart.title = 'Zpool';
    this.zpoolChart.data = [used,available];
    console.log(this.zpoolChart.data);
    this.zpoolChart.width = this.chartSize;
    this.zpoolChart.height = this.chartSize;
  };

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
     let cpuUser: ChartData = {
       legend: 'CPU',
       data: evt.data.data
     }
     */

    this.cpuChart.chartType = 'area-spline';
    this.cpuChart.units = '%';
    this.cpuChart.timeSeries = true;
    this.cpuChart.timeFormat = '%H:%M';// eg. %m-%d-%Y %H:%M:%S.%L
    this.cpuChart.timeData = evt.data.meta;
    this.cpuChart.data = parsedData;//[cpuUser];
    this.cpuChart.width = this.chartSize;
    this.cpuChart.height = this.chartSize;
  }
}
