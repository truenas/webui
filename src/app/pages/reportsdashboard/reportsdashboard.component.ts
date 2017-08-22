import {Component, OnInit} from '@angular/core';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';

import {
  RestService,
  SystemGeneralService,
  WebSocketService
} from '../../services/';

@Component({
  selector : 'reportsdashboard',
  styleUrls : [ './reportsdashboard.scss' ],
  templateUrl : './reportsdashboard.html',
  providers : [ SystemGeneralService ]
})
export class ReportsDashboard implements OnInit {

  public info: any = {};
  public ipAddress: any = [];
  private allowChartsDisplay: boolean = true;
  
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
    
  }

  ngOnInit() {
   
  }
  
  tabSelectChangeHandler($event) {
    this.allowChartsDisplay = false;
    setTimeout(()=> {  this.allowChartsDisplay = true; }, -1 );
      
  }
}
