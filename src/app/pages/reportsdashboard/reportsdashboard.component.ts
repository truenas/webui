import {Component, OnInit} from '@angular/core';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';
import {LineChartService, ChartConfigData, HandleChartConfigDataFunc} from './lineChart/lineChart.service';

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
export class ReportsDashboard implements OnInit, HandleChartConfigDataFunc {

  public info: any = {};
  public ipAddress: any = [];
  private allowChartsDisplay: boolean = true;
  private drawTabs: boolean = false; 
  public graphs: ChartConfigData[] = [];

  constructor(private _lineChartService: LineChartService) {
    
  }

  ngOnInit() {
     this._lineChartService.getChartConfigData(this);
  }
  
  
  handleChartConfigDataFunc(chartConfigData: ChartConfigData[]) {;
     this.graphs.splice(0, this.graphs.length);
     chartConfigData.forEach( (label) => {this.graphs.push(label)});
     this.drawTabs = true; 
  }
  
  tabSelectChangeHandler($event) {
    this.allowChartsDisplay = false;
    setTimeout(()=> {  this.allowChartsDisplay = true; }, -1 );
      
  }
}
