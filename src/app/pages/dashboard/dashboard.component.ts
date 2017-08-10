import {Component, OnInit} from '@angular/core';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';

import {
  RestService,
  SystemGeneralService,
  WebSocketService
} from '../../services/';

@Component({
  selector : 'dashboard',
  styleUrls : [ './dashboard.scss' ],
  templateUrl : './dashboard.html',
  providers : [ SystemGeneralService ]
})
export class Dashboard implements OnInit {

  public info: any = {};
  public ipAddress: any = [];

  public graphs: any[] = [
    {
      title : "Average Load",
      legends : [ 'Short Term', ' Mid Term', 'Long Term' ],
      dataList : [
        {'source' : 'load', 'type' : 'load', 'dataset' : 'shortterm'},
        {'source' : 'load', 'type' : 'load', 'dataset' : 'midterm'},
        {'source' : 'load', 'type' : 'load', 'dataset' : 'longterm'},
      ],
    },
    {
      title : "Memory",
      legends : [ 'Free', 'Active', 'Cache', 'Wired', 'Inactive' ],
      dataList : [
        {'source' : 'memory', 'type' : 'memory-free', 'dataset' : 'value'},
        {'source' : 'memory', 'type' : 'memory-active', 'dataset' : 'value'},
        {'source' : 'memory', 'type' : 'memory-cache', 'dataset' : 'value'},
        {'source' : 'memory', 'type' : 'memory-wired', 'dataset' : 'value'},
        {'source' : 'memory', 'type' : 'memory-inactive', 'dataset' : 'value'},
      ],
    },
    {
      title : "CPU Usage",
      legends : [ 'User', 'Interrupt', 'System', 'Idle', 'Nice' ],
      dataList : [
        {
          'source' : 'aggregation-cpu-sum',
          'type' : 'cpu-user',
          'dataset' : 'value'
        },
        {
          'source' : 'aggregation-cpu-sum',
          'type' : 'cpu-interrupt',
          'dataset' : 'value'
        },
        {
          'source' : 'aggregation-cpu-sum',
          'type' : 'cpu-system',
          'dataset' : 'value'
        },
        {
          'source' : 'aggregation-cpu-sum',
          'type' : 'cpu-idle',
          'dataset' : 'value'
        },
        {
          'source' : 'aggregation-cpu-sum',
          'type' : 'cpu-nice',
          'dataset' : 'value'
        },
      ],
    },
  ];

  constructor(private rest: RestService, private ws: WebSocketService,
              protected systemGeneralService: SystemGeneralService) {
    rest.get('storage/volume/', {}).subscribe((res) => {
      res.data.forEach((vol) => {
        this.graphs.splice(0, 0, {
          title : vol.vol_name + " Volume Usage",
          type : 'Pie',
          legends : [ 'Available', 'Used' ],
          dataList : [],
          series : [ vol.avail, vol.used ],
        });
      });
    });
  }

  ngOnInit() {
    this.ws.call('system.info').subscribe((res) => {
      this.info = res;
      this.info.loadavg =
          this.info.loadavg.map((x, i) => { return x.toFixed(2); }).join(' ');
      this.info.physmem =
          Number(this.info.physmem / 1024 / 1024).toFixed(0) + ' MiB';
    });
    this.systemGeneralService.getIPChoices().subscribe((res) => {
      if (res.length > 0) {
        this.ipAddress = _.uniq(res[0]);
      } else {
        this.ipAddress = res;
      }
      console.log(this.ipAddress);
    })
  }
}
