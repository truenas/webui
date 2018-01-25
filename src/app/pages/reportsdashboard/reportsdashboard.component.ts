import { Component, OnInit, OnDestroy, AfterViewInit, EventEmitter, Output } from '@angular/core';
import * as _ from 'lodash';
import {LineChartService, ChartConfigData, HandleChartConfigDataFunc} from '../../components/common/lineChart/lineChart.service';

import {
  RestService,
  SystemGeneralService,
  WebSocketService
} from '../../services/';
import { PageEvent } from '@angular/material';
import { ErdService } from 'app/services/erd.service';


interface TabChartsMappingData {
  keyName: string;
  chartConfigData: ChartConfigData[];
  paginatedChartConfigData: ChartConfigData[]
}

@Component({
  selector: 'reportsdashboard',
  styleUrls: ['./reportsdashboard.scss'],
  templateUrl: './reportsdashboard.html',
  providers: [SystemGeneralService]
})
export class ReportsDashboardComponent implements OnInit, OnDestroy, HandleChartConfigDataFunc, AfterViewInit {


   // MdPaginator Inputs
   paginationLength = 0;
   paginationPageSize = 5;
   paginationPageSizeOptions = [5, 10, 20];
   paginationPageIndex = 0;
   paginationPageEvent: PageEvent;
   
   setPaginationPageSizeOptions(setPaginationPageSizeOptionsInput: string) {
     this.paginationPageSizeOptions = setPaginationPageSizeOptionsInput.split(',').map(str => +str);
   }

   
  public info: any = {};
  public ipAddress: any = [];
  public drawTabs = false;
  public tabChartsMappingDataArray: TabChartsMappingData[] = [];
  public tabChartsMappingDataSelected: TabChartsMappingData;
  


  constructor(private _lineChartService: LineChartService, private erdService: ErdService) {
    
  }

  private setPaginationInfo(tabChartsMappingDataSelected: TabChartsMappingData) {
    let paginationChartData: ChartConfigData[] = new Array();
    tabChartsMappingDataSelected.chartConfigData.forEach((item)=>{paginationChartData.push(item)});

    const beginIndex = this.paginationPageIndex * this.paginationPageSize;
    const endIndex = beginIndex + this.paginationPageSize ;
    if( beginIndex < paginationChartData.length && endIndex > paginationChartData.length ) {
      paginationChartData = paginationChartData.slice(beginIndex, paginationChartData.length);
    } else if( endIndex < paginationChartData.length ) {
      paginationChartData = paginationChartData.slice(beginIndex, endIndex);
    }

    tabChartsMappingDataSelected.paginatedChartConfigData = paginationChartData;


    this.paginationLength = this.tabChartsMappingDataSelected.chartConfigData.length;
  }

  ngOnInit() { 
    this._lineChartService.getChartConfigData(this);

    

  }

  ngOnDestroy() {
  }

  ngAfterViewInit(): void {
    this.erdService.attachResizeEventToElement("dashboardcontainerdiv");
  }

  /**
   * The service returns back all sources as a flat list.  What I do in here is
   * Go through the flat list.. And collect the ones I want for each Tab I want to show.
   */
  handleChartConfigDataFunc(chartConfigData: ChartConfigData[]) {
    const map: Map<string, TabChartsMappingData> = new Map<string, TabChartsMappingData>();

    // For every one of these map entries.. You see one tab in the UI With the charts collected for that tab
    map.set("CPU", {
      keyName: "CPU",
      chartConfigData: [],
      paginatedChartConfigData: []

    });

    map.set("Disk", {
      keyName: "Disk",
      chartConfigData: [],
      paginatedChartConfigData: []
    });

    map.set("Memory", {
      keyName: "Memory",
      chartConfigData: [],
      paginatedChartConfigData: []
    });

    map.set("Network", {
      keyName: "Network",
      chartConfigData: [],
      paginatedChartConfigData: []
    });


    map.set("Partition", {
      keyName: "Partition",
      chartConfigData: [],
      paginatedChartConfigData: []
    });

    map.set("System", {
      keyName: "System",
      chartConfigData: [],
      paginatedChartConfigData: []
    });

    map.set("Target", {
      keyName: "Target",
      chartConfigData: [],
      paginatedChartConfigData: []
    });

    map.set("ZFS", {
      keyName: "ZFS",
      chartConfigData: [],
      paginatedChartConfigData: []
    });

    // Go through all the items.. Sticking each source in the appropraite bucket
    // The non known buckets.. Just get one tab/one chart. (for now).. Will eventually 
    // move towards.. just knowing the ones Im wanting.
    chartConfigData.forEach((chartConfigDataItem: ChartConfigData) => {
      if (chartConfigDataItem.title === "CPU" || chartConfigDataItem.title === "Load") {
        const tab: TabChartsMappingData = map.get("CPU");
        tab.chartConfigData.push(chartConfigDataItem);

      } else if (chartConfigDataItem.title.toLowerCase().startsWith("memory") || chartConfigDataItem.title.toLowerCase().startsWith("swap")) {
        const tab: TabChartsMappingData = map.get("Memory");
        tab.chartConfigData.push(chartConfigDataItem);

      } else if (chartConfigDataItem.title.toLowerCase() === "processes" || chartConfigDataItem.title.toLowerCase() === "uptime") {
        const tab: TabChartsMappingData = map.get("System");
        tab.chartConfigData.push(chartConfigDataItem);

      } else if (chartConfigDataItem.title.startsWith("df-")) {
        const tab: TabChartsMappingData = map.get("Partition");
        tab.chartConfigData.push(chartConfigDataItem);

      } else if (chartConfigDataItem.title.startsWith("disk")) {
        const tab: TabChartsMappingData = map.get("Disk");
        tab.chartConfigData.push(chartConfigDataItem);

      } else if (chartConfigDataItem.title.startsWith("interface-")) {
        const tab: TabChartsMappingData = map.get("Network");
        tab.chartConfigData.push(chartConfigDataItem);

      } else if (chartConfigDataItem.title.startsWith("ctl-tpc")) {
        const tab: TabChartsMappingData = map.get("Target");
        tab.chartConfigData.push(chartConfigDataItem);

      } else if (chartConfigDataItem.title.startsWith("ZFS ")) {
        const tab: TabChartsMappingData = map.get("ZFS");
        tab.chartConfigData.push(chartConfigDataItem);

      }
    });

    this.tabChartsMappingDataArray.splice(0, this.tabChartsMappingDataArray.length);
    map.forEach((value: TabChartsMappingData) => {

      if (this.tabChartsMappingDataSelected === undefined) {
        this.tabChartsMappingDataSelected = value;
        this.setPaginationInfo( this.tabChartsMappingDataSelected );
      }
      this.tabChartsMappingDataArray.push(value);
    });
    

    this.drawTabs = true;

  }

  tabSelectChangeHandler($event) {
    const selectedTabName: string = $event.tab.textLabel;
    this.tabChartsMappingDataSelected = this.getTabChartsMappingDataByName(selectedTabName);
    this.paginationPageIndex = 0;
    this.paginationPageSize = 5;
    this.setPaginationInfo( this.tabChartsMappingDataSelected );
    
  }
  
  paginationUpdate($pageEvent: PageEvent) {
    this.paginationPageEvent = $pageEvent;
    this.paginationPageIndex = this.paginationPageEvent.pageIndex;
    this.paginationPageSize = this.paginationPageEvent.pageSize;
    this.setPaginationInfo( this.tabChartsMappingDataSelected );
  }



  private getTabChartsMappingDataByName(name: string): TabChartsMappingData {
    let foundTabChartsMappingData: TabChartsMappingData = null;

    for (const item of this.tabChartsMappingDataArray) {
      if (name === item.keyName) {
        foundTabChartsMappingData = item;
        break;
      }
    }
    return foundTabChartsMappingData;
  }


}
