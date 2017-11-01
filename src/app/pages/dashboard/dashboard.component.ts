import { ChartFormatter } from '../../components/common/lineChart/lineChart.component';
import {Component, OnInit, AfterViewInit} from '@angular/core';
import * as _ from 'lodash';
import filesize from 'filesize';

import {
  RestService,
  SystemGeneralService,
  WebSocketService
} from '../../services/';
import { ChartConfigData, LineChartService } from 'app/components/common/lineChart/lineChart.service';


@Component({
  selector: 'dashboard',
  styleUrls: ['./dashboard.scss'],
  templateUrl: './dashboard.html',
  providers: [SystemGeneralService]
})
export class DashboardComponent implements OnInit, AfterViewInit {


  public info: any = {};
  public ipAddress: any = [];
  public chartFormatter: ChartFormatter = {
    format(value, ratio, id) {
      return filesize(value, {standard: "iec"});
    }
  };
  public graphs: ChartConfigData[] = [
    {
      title: "Average Load",
      legends: ['Short Term', ' Mid Term', 'Long Term'],
      type: LineChartService.lineChart,
      dataList: [
        {'source': 'load', 'type': 'load', 'dataset': 'shortterm'},
        {'source': 'load', 'type': 'load', 'dataset': 'midterm'},
        {'source': 'load', 'type': 'load', 'dataset': 'longterm'},
      ],
    },
    {
      title: "Memory (gigabytes)",
      type: LineChartService.lineChart,
      legends: ['Free', 'Active', 'Cache', 'Wired', 'Inactive'],
      dataList: [
        {'source': 'memory', 'type': 'memory-free', 'dataset': 'value'},
        {'source': 'memory', 'type': 'memory-active', 'dataset': 'value'},
        {'source': 'memory', 'type': 'memory-cache', 'dataset': 'value'},
        {'source': 'memory', 'type': 'memory-wired', 'dataset': 'value'},
        {'source': 'memory', 'type': 'memory-inactive', 'dataset': 'value'},
      ],
      divideBy: 1073741824 // Gigs worth of bytes
    },
    {
      title: "CPU Usage",
      type: LineChartService.lineChart,
      legends: ['User', 'Interrupt', 'System', 'Idle', 'Nice'],
      dataList: [
        {'source': 'aggregation-cpu-sum', 'type': 'cpu-user', 'dataset': 'value'},
        {'source': 'aggregation-cpu-sum', 'type': 'cpu-interrupt', 'dataset': 'value'},
        {'source': 'aggregation-cpu-sum', 'type': 'cpu-system', 'dataset': 'value'},
        {'source': 'aggregation-cpu-sum', 'type': 'cpu-idle', 'dataset': 'value'},
        {'source': 'aggregation-cpu-sum', 'type': 'cpu-nice', 'dataset': 'value'},
      ],
    },
    {
      title: "Uptime",
      type: LineChartService.lineChart,
      legends: ['Uptime'],
      dataList: [
        {'source': 'uptime', 'type': 'uptime', 'dataset': 'value'}
      ],
    }
  ];

  private erd: any = null;

  constructor(private rest: RestService, private ws: WebSocketService,
    protected systemGeneralService: SystemGeneralService) {
    rest.get('storage/volume/', {}).subscribe((res) => {
      res.data.forEach((vol) => {
        this.graphs.splice(0, 0, {
          title: vol.vol_name + " Volume Usage",
          type: LineChartService.pieChart,
          legends: ['Available', 'Used'],
          dataList: [],
          series: [['Available', vol.avail], ['Used', vol.used]]
        });
      });
    });
  }

  ngOnInit() {
    this.ws.call('system.info').subscribe((res) => {
      this.info = res;
      this.info.loadavg =
        this.info.loadavg.map((x, i) => {return x.toFixed(2);}).join(' ');
      this.info.physmem =
        Number(this.info.physmem / 1024 / 1024).toFixed(0) + ' MiB';
    });
    this.systemGeneralService.getIPChoices().subscribe((res) => {
      if (res.length > 0) {
        this.ipAddress = _.uniq(res[0]);
      } else {
        this.ipAddress = res;
      }
    });


    // This invokes the element-resize-detector js library under node_modules
    // It listens to element level size change events (even when the global window
    // Doesn't Resize.)  This lets you even off of card and element and div level
    // size rechange events... As a result of responive, menu moving, etc...
    if (window.hasOwnProperty('elementResizeDetectorMaker')) {
      this.erd = window['elementResizeDetectorMaker'].call();
    }
  }

  ngAfterViewInit(): void {
    this.erd.listenTo(document.getElementById("dashboardcontainerdiv"), (element) => {
      (<any>window).dispatchEvent(new Event('resize'));
    });
  }
}
