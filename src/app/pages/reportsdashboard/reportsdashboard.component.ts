import {Component, OnInit} from '@angular/core';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';
import {LineChartService, ChartConfigData} from './lineChart/lineChart.service';

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
  
  public graphs: ChartConfigData[] = [];

  constructor(private _lineChartService: LineChartService) {
    
  }

  ngOnInit() {
     this.graphs = this._lineChartService.getChartConfigData();
  }
  
  tabSelectChangeHandler($event) {
    this.allowChartsDisplay = false;
    setTimeout(()=> {  this.allowChartsDisplay = true; }, -1 );
      
  }
}
