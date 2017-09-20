import {Component, OnInit, AfterViewInit} from '@angular/core';
import * as _ from 'lodash';
import {LineChartService, ChartConfigData, HandleChartConfigDataFunc} from '../../components/common/lineChart/lineChart.service';
import * as c3 from 'c3';

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
export class ReportsDashboardComponent implements OnInit, HandleChartConfigDataFunc, AfterViewInit {


  public info: any = {};
  public ipAddress: any = [];
  public allowChartsDisplay = true;
  public drawTabs = false;
  public tabChartsMappingDataArray: TabChartsMappingData[] = [];
  public tabChartsMappingDataSelected: TabChartsMappingData;

  private erd: any = null;

  constructor(private _lineChartService: LineChartService) {
  }

  ngOnInit() {
    this._lineChartService.getChartConfigData(this);

    // This invokes the element-resize-detector js library under node_modules
    // It listens to element level size change events (even when the global window
    // Doesn't Resize.)  This lets you even off of card and element and div level
    // size rechange events... As a result of responive, menu moving, etc...
    if (window.hasOwnProperty('elementResizeDetectorMaker')) {
      this.erd = window['elementResizeDetectorMaker'].call();
    }

    const chart = c3.generate({
      bindto: '#fuckingchartDUDE',
      data: {
        columns: [
          ['xValues', '01:10', '03:10', '04:10', '05:10', '06:10' ],
          ['data1', 30, 200, 100, 400, 150, 250],
          ['data2', 50, 20, 10, 40, 15, 25],
          ['data3', 20, 80, 60, 20, 15, 45]
        ],
        x: 'xValues',
        xFormat: '%H:%M',
        type: 'area-spline'
      },
      axis: {
        x: {
            type: 'timeseries',
            tick: {
                format: '%H:%M',
                fit: true,
                values: ['01:10', '03:10', '06:10']
            }
        }
    }

    });

  }

  ngAfterViewInit(): void {
    this.erd.listenTo(document.getElementById("dashboardcontainerdiv"), (element) => {
      (<any>window).dispatchEvent(new Event('resize'));
    });
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

    map.set("Target", {
      keyName: "Target",
      chartConfigData: []
    });

    map.set("ZFS", {
      keyName: "ZFS",
      chartConfigData: []
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
      }
      this.tabChartsMappingDataArray.push(value);
    });

    this.drawTabs = true;

  }

  tabSelectChangeHandler($event) {
    const selectedTabName: string = $event.tab.textLabel;
    this.tabChartsMappingDataSelected = this.getTabChartsMappingDataByName(selectedTabName);


    this.allowChartsDisplay = false;
    setTimeout(() => {this.allowChartsDisplay = true;}, -1);

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
