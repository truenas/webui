import { ChartFormatter } from '../../components/common/lineChart/lineChart.component';
import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import * as _ from 'lodash';
import filesize from 'filesize';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs/Subscription';
import { RxCommunicatingService } from '../../services/rx-communicating.service';

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
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {

  public info: any = {};
  public ipAddress: any = [];
  public chartFormatter: ChartFormatter = {
    format(value, ratio, id) {
      return filesize(value, {standard: "iec"});
    }
  };
  public graphs: ChartConfigData[];
  private erd: any = null;
  private subscription: Subscription;

  constructor(private rest: RestService,
    private ws: WebSocketService,
    protected systemGeneralService: SystemGeneralService,
    public translate: TranslateService,
    private rxcomService: RxCommunicatingService) {    
    this.onInitDashboardChart();

    // i18n Translate
    this.subscription = this.rxcomService.getDataFromOrigin().subscribe((res) => {
      if(res && res.type == "language") {
        let timeout = setTimeout(() => {  
          this.onInitDashboardChart();
          clearTimeout(timeout);
        }, 100);        
      }
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

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  ngAfterViewInit(): void {
    this.erd.listenTo(document.getElementById("dashboardcontainerdiv"), (element) => {
      (<any>window).dispatchEvent(new Event('resize'));
    });
  }

  onInitDashboardChart() {
    this.graphs = [
      {
        title: this.translate.instant("Average Load"),
        legends: [
          this.translate.instant('Short Term'),
          this.translate.instant('Mid Term'),
          this.translate.instant('Long Term')
        ],
        type: LineChartService.lineChart,
        dataList: [
          {'source': 'load', 'type': 'load', 'dataset': 'shortterm'},
          {'source': 'load', 'type': 'load', 'dataset': 'midterm'},
          {'source': 'load', 'type': 'load', 'dataset': 'longterm'},
        ],
      },
      {
        title: this.translate.instant("Memory (gigabytes)"),
        type: LineChartService.lineChart,
        legends: [
          this.translate.instant('Free'),
          this.translate.instant('Active'),
          this.translate.instant('Cache'),
          this.translate.instant('Wired'),
          this.translate.instant('Inactive')
        ],
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
        title: this.translate.instant("CPU Usage"),
        type: LineChartService.lineChart,
        legends: [
          this.translate.instant('User'),
          this.translate.instant('Interrupt'),
          this.translate.instant('System'),
          this.translate.instant('Idle'),
          'Nice'
        ],
        dataList: [
          {'source': 'aggregation-cpu-sum', 'type': 'cpu-user', 'dataset': 'value'},
          {'source': 'aggregation-cpu-sum', 'type': 'cpu-interrupt', 'dataset': 'value'},
          {'source': 'aggregation-cpu-sum', 'type': 'cpu-system', 'dataset': 'value'},
          {'source': 'aggregation-cpu-sum', 'type': 'cpu-idle', 'dataset': 'value'},
          {'source': 'aggregation-cpu-sum', 'type': 'cpu-nice', 'dataset': 'value'},
        ],
      },
      {
        title: this.translate.instant("Uptime"),
        type: LineChartService.lineChart,
        legends: [this.translate.instant('Uptime')],
        dataList: [
          {'source': 'uptime', 'type': 'uptime', 'dataset': 'value'}
        ],
      }
    ];

    this.rest.get('storage/volume/', {}).subscribe((res) => {
      res.data.forEach((vol) => {
        this.graphs.splice(0, 0, {
          title: vol.vol_name + " " + this.translate.instant("Volume Usage"),
          type: LineChartService.pieChart,
          legends: [this.translate.instant("Available"), this.translate.instant("Used")],
          dataList: [],
          series: [[this.translate.instant("Available"), vol.avail], [this.translate.instant("Used"), vol.used]]
        });
      });
    });

    this.ws.call('stats.get_sources').subscribe((res) => {
      let gLegends = [], gDataList = [];
      
      for (const prop in res) {
        if (prop.startsWith("disk-") && !prop.startsWith("disk-cd")) {
          prop.replace("disk", this.translate.instant("disk"));
          gLegends.push(prop + " (" + this.translate.instant("read") + ")");
          gLegends.push(prop + " (" + this.translate.instant("write") + ")");
          gDataList.push({source: prop, type: 'disk_ops', dataset: 'read'});
          gDataList.push({source: prop, type: 'disk_ops', dataset: 'write'});
        }
      }
      this.graphs.push({
        title: this.translate.instant("Disk IOPS"),
        type: LineChartService.lineChart,
        legends: gLegends,
        dataList: gDataList
      });
    });
  }
}
