import { Component, OnInit, ViewChild } from '@angular/core';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { ChartData } from 'app/core/components/viewchart/viewchart.component';
import { ViewChartPieComponent } from 'app/core/components/viewchartpie/viewchartpie.component';
import { ViewChartDonutComponent } from 'app/core/components/viewchartdonut/viewchartdonut.component';
import { Subject } from 'rxjs/Subject';
import filesize from 'filesize';

@Component({
  selector: 'vm-summary',
  templateUrl: './vm-summary.component.html',
  styleUrls: ['./vm-summary.component.css']
  })
export class VmSummaryComponent implements OnInit {
  
  @ViewChild('cpu') cpuChart:ViewChartPieComponent;
  @ViewChild('zpool') zpoolChart:ViewChartDonutComponent;
  @ViewChild('net') netChart:ViewChartPieComponent;
  public chartSize:number = 260;

  constructor(private core:CoreService) {
  }

  ngOnInit() {

    this.core.register({observerClass:this,eventName:"PoolData"}).subscribe((evt:CoreEvent) => {
      console.log(evt);
      this.setPoolData(evt);
    });

    this.core.emit({name:"PoolDataRequest"});

    this.cpuChart.data = [
      {legend: 'A', data:[10]},
      {legend: 'B', data:[90]}
    ];
    this.cpuChart.width = this.chartSize;
    this.cpuChart.height = this.chartSize;

    this.netChart.data = [
      {legend: 'C', data:[10]},
      {legend: 'D', data:[90]}
    ];
    this.netChart.width = this.chartSize;
    this.netChart.height = this.chartSize;


  }

  // rest.get('storage/volume/', {}).subscribe((res) => {});
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

    this.zpoolChart.units = 'GB';
    this.zpoolChart.title = 'Zpool';
    this.zpoolChart.data = [used,available];
    console.log(this.zpoolChart.data);
    this.zpoolChart.width = this.chartSize;
    this.zpoolChart.height = this.chartSize;
  };
}
