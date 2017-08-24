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

    chartConfigData.forEach((chartConfigDataItem: ChartConfigData) => {
      if (chartConfigDataItem.title === "CPU" || chartConfigDataItem.title === "Load") {
        let tab: TabChartsMappingData = map.get("CPU");
        tab.chartConfigData.push(chartConfigDataItem);
      } else {
        map.set(chartConfigDataItem.title, {
          keyName: chartConfigDataItem.title,
          chartConfigData: [chartConfigDataItem]
        });

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
