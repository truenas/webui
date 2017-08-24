import {Component, OnInit} from '@angular/core';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';
import {LineChartService, ChartConfigData, HandleChartConfigDataFunc} from './lineChart/lineChart.service';

import {
  RestService,
  SystemGeneralService,
  WebSocketService
} from '../../services/';


interface TabChartsMappingData {
  keyName: string;
  chartConfigData: ChartConfigData[];
}

@Component({
  selector: 'reportsdashboard',
  styleUrls: ['./reportsdashboard.scss'],
  templateUrl: './reportsdashboard.html',
  providers: [SystemGeneralService]
})
export class ReportsDashboard implements OnInit, HandleChartConfigDataFunc {

  public info: any = {};
  public ipAddress: any = [];
  public allowChartsDisplay: boolean = true;
  public drawTabs: boolean = false;
  public tabChartsMappingData: TabChartsMappingData[] = [];

  constructor(private _lineChartService: LineChartService) {
  }

  ngOnInit() {
    this._lineChartService.getChartConfigData(this);
  }


  handleChartConfigDataFunc(chartConfigData: ChartConfigData[]) {
    let map: Map<string, TabChartsMappingData> = new Map<string, TabChartsMappingData>();

    map.set("CPU", {
      keyName: "CPU",
      chartConfigData: []
    });
    
    map.set("Disk", {
      keyName: "Disk",
      chartConfigData: []
    });
    
     map.set("Memory", {
      keyName: "Memory",
      chartConfigData: []
    });
    
    map.set("Network", {
      keyName: "Network",
      chartConfigData: []
    });
    
    
    map.set("Partition", {
      keyName: "Partition",
      chartConfigData: []
    });
    
     map.set("System", {
      keyName: "System",
      chartConfigData: []
    });

    // Go through all the items.. Sticking each source in the appropraite bucket
    // The non known buckets.. Just get one tab/one chart. (for now).. Will eventually 
    // move towards.. just knowing the ones Im wanting.
    chartConfigData.forEach((chartConfigDataItem: ChartConfigData) => {
      if (chartConfigDataItem.title === "CPU" || chartConfigDataItem.title === "Load") {
        let tab: TabChartsMappingData = map.get("CPU");
        tab.chartConfigData.push(chartConfigDataItem);
        
      } else if (chartConfigDataItem.title.toLowerCase() === "memory" || chartConfigDataItem.title.toLowerCase() === "swap") {
        let tab: TabChartsMappingData = map.get("Memory");
        tab.chartConfigData.push(chartConfigDataItem);
        
      } else if (chartConfigDataItem.title.toLowerCase() === "processes" || chartConfigDataItem.title.toLowerCase() === "uptime") {
        let tab: TabChartsMappingData = map.get("System");
        tab.chartConfigData.push(chartConfigDataItem);
        
      } else if (chartConfigDataItem.title.startsWith("df-")) {
        let tab: TabChartsMappingData = map.get("Partition");
        tab.chartConfigData.push(chartConfigDataItem);
        
      } else if (chartConfigDataItem.title.startsWith("disk")) {
        let tab: TabChartsMappingData = map.get("Disk");
        tab.chartConfigData.push(chartConfigDataItem);
        
      } else if (chartConfigDataItem.title.startsWith("interface-")) {
        let tab: TabChartsMappingData = map.get("Network");
        tab.chartConfigData.push(chartConfigDataItem);
        
      } else {
        
        //map.set(chartConfigDataItem.title, {
        //  keyName: chartConfigDataItem.title,
        //  chartConfigData: [chartConfigDataItem]
        //});

      }
    });
    
    this.tabChartsMappingData.splice(0, this.tabChartsMappingData.length);
    map.forEach((value: TabChartsMappingData )=>{ 
         this.tabChartsMappingData.push( value );
    });  
    
    this.drawTabs = true;
  }

  tabSelectChangeHandler($event) {
    let selectedTabName = $event.tab.textLabel;

    this.allowChartsDisplay = false;
    setTimeout(() => {this.allowChartsDisplay = true;}, -1);

  }
}
