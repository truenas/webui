import { Component, AfterViewInit, Input, ViewChild, OnDestroy, OnChanges} from '@angular/core';
import { CoreServiceInjector } from 'app/core/services/coreserviceinjector';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { WebSocketService } from 'app/services/';
import { MaterialModule } from 'app/appMaterial.module';
import { Subject } from 'rxjs/Subject';
import { NgForm } from '@angular/forms';
import { ChartData } from 'app/core/components/viewchart/viewchart.component';
import { LineChartComponent } from '../lineChart/lineChart.component';

import { Router } from '@angular/router';
import { UUID } from 'angular2-uuid';

import * as moment from 'moment';
import filesize from 'filesize';
import { WidgetComponent } from 'app/core/components/widgets/widget/widget.component';
import { TranslateService } from '@ngx-translate/core';

import { T } from '../../../../translate-marker';

export interface TimeData {
  start: number;// Seconds since epoch time
  end?: number;// Seconds since epoch time
  step?: string;
  legend?: string;
}

interface TimeAxisData {
  timespan:string;
  timeformat:string;
  culling: number;
}

interface LineChartConfig {
  dataList:any;
  divideBy:number;
  legends:any;
}

export interface Report {
  name: string;
  title: string;
  vertical_label: string;
  identifiers?: string[];
  isRendered?: boolean[];
}

export interface ReportData {
  identifier?: string;
  start: number;
  end: number;
  aggregations: any;
  legend: string[];
  name: string;
  step: number;
  data: number[];
}

@Component({
  selector: 'report',
  templateUrl:'./report.component.html',
  styleUrls: ['./report.component.css']
})
export class ReportComponent extends WidgetComponent implements AfterViewInit, OnChanges ,OnDestroy {

  // Labels
  @Input() localControls?: boolean = true;; 
  @Input() report: Report;
  @Input() utils: Worker;
  @Input() identifier?: string;
  @ViewChild(LineChartComponent, {static: false}) lineChart:LineChartComponent;

  public data: ReportData;
  
  get reportTitle(){
    return this.identifier ? this.report.title.replace(/{identifier}/, this.identifier) : this.report.title;
  }

  get aggregationKeys (){
    return Object.keys(this.data.aggregations);
  }

  public legendLabels: Subject<any> = new Subject();
  public subtitle:string = T("% of all cores");
  public altTitle: string = '';
  public altSubtitle: string = '';
  public widgetColorCssVar: string = 'var(--primary)';
  public isActive:boolean = true;

  public currentStartDate: number;// as seconds from Unix Epoch
  public currentEndDate: number;// as seconds from Unix Epoch
  public timeZoomIndex:number = 4;

  public stepForwardDisabled: boolean = true;

  private _zoomInDisabled: boolean = false;
  get zoomInDisabled(){
    return this.timeZoomIndex >= (this.zoomLevels.length - 1);
  }
  public _zoomOutDisabled: boolean = false;
  get zoomOutDisabled(){
    return this.timeZoomIndex <= 0;
  }

  public zoomLevels: TimeAxisData[] = [
    { timespan: '5M', timeformat: "%b '%y", culling: 6},// 6 months
    { timespan: '1M', timeformat: 'Week %W', culling: 4},// 1 month
    { timespan: '7d', timeformat: '%d %b', culling: 6},// 1 week
    { timespan: '24h', timeformat: '%a %H:%M', culling: 4},// 24hrs
    { timespan: '60m', timeformat: '%H:%M', culling: 6}// 60 minutes
  ]

  // Loader
  public loader:boolean = false;
  private _dataRcvd:boolean = false;
  get dataRcvd(){
    return this._dataRcvd;
  }
  set dataRcvd(val){
    this._dataRcvd = val;
    if(val){
      this.loader = false;
    }
  }

  // Chart Options
  public showLegendValues:boolean = false;
  public chartId = "chart-" + UUID.UUID();

  public startTime;
  public endTime;

  constructor(public router: Router, public translate: TranslateService, private ws: WebSocketService){
    super(translate); 
    this.loader = true;
  }

  ngOnDestroy(){
    this.core.unregister({observerClass:this});
  }

  ngAfterViewInit(){
    this.stepForwardDisabled = true;
    const zoom =  this.zoomLevels[this.timeZoomIndex];
    const rrdOptions = this.convertTimespan(zoom.timespan)
    this.currentStartDate = rrdOptions.start;
    this.currentEndDate = rrdOptions.end;
  }

  ngOnChanges(changes){
    if(changes.report){
      const zoom = this.zoomLevels[this.timeZoomIndex];
      const rrdOptions = this.convertTimespan(zoom.timespan)
      let identifier = changes.report.currentValue.identifiers ? changes.report.currentValue.identifiers[0] : null;
      this.fetchReportData(rrdOptions, changes.report.currentValue, identifier);
    }
  }

  setChartInteractive(value:boolean){
    this.isActive = value;
  }

  timeZoomIn(){
    // more detail
    const max = 4; 
    if(this.timeZoomIndex == max){ return;}
    this.timeZoomIndex += 1;
    const zoom = this.zoomLevels[this.timeZoomIndex];
    const rrdOptions = this.convertTimespan(zoom.timespan);
    this.currentStartDate = rrdOptions.start;
    this.currentEndDate = rrdOptions.end;
    
    let identifier = this.report.identifiers ? this.report.identifiers[0] : null;
    this.fetchReportData(rrdOptions, this.report, identifier);
  }

  timeZoomOut(){
    // less detail
    const min = Number(0);
    if(this.timeZoomIndex == min){ return;}
    this.timeZoomIndex -= 1;
    const zoom = this.zoomLevels[this.timeZoomIndex]
    const rrdOptions = this.convertTimespan(zoom.timespan);
    this.currentStartDate = rrdOptions.start;
    this.currentEndDate = rrdOptions.end;
    
    let identifier = this.report.identifiers ? this.report.identifiers[0] : null;
    this.fetchReportData(rrdOptions, this.report, identifier);
  }

  stepBack(){
    const zoom = this.zoomLevels[this.timeZoomIndex];
    const rrdOptions = this.convertTimespan(zoom.timespan, 'backward', this.currentStartDate);
    this.currentStartDate = rrdOptions.start;
    this.currentEndDate = rrdOptions.end;
    
    let identifier = this.report.identifiers ? this.report.identifiers[0] : null;
    this.fetchReportData(rrdOptions, this.report, identifier);
  }

  stepForward(){
    const zoom = this.zoomLevels[this.timeZoomIndex];

    const rrdOptions = this.convertTimespan(zoom.timespan, 'forward', this.currentEndDate);
    this.currentStartDate = rrdOptions.start;
    this.currentEndDate = rrdOptions.end;
    
    let identifier = this.report.identifiers ? this.report.identifiers[0] : null;
    this.fetchReportData(rrdOptions, this.report, identifier);
  }

  // Convert timespan to start/end options for RRDTool
  convertTimespan(timespan, direction?: string, currentDate?:number): TimeData{
    if(!direction){
      direction = 'backward';
    }
    
    let units: string;
    let value: number;

    const now = new Date();
    let startDate:Date;
    let endDate:Date;
    if(direction == 'backward' && !currentDate){
      endDate = now;
    } else if(direction == 'backward' && currentDate ) {
      endDate = new Date(currentDate);
    } else if(direction == 'forward' && currentDate){
      startDate = new Date(currentDate);
    } else {
      throw "A current date parameter must be specified when stepping forward in time!\n direction specified was " + direction
    }

    switch(timespan){
    case '5M':
      units = 'months';
      value = 5;
    break;
    case '1M':
      units = 'months';
      value = 1;
    break;
    case '7d':
      units = 'days';
      value = 7;
    break;
    case '24h':
      units = 'hours';
      value = 24;
    break;
    case '60m':
      units = 'minutes';
      value = 60;
    break;
    }

    let mom: any;
    if(direction == 'backward'){
      mom = moment(endDate);
      startDate = mom.subtract(value, units).toDate();
    } else if(direction == 'forward'){
      mom = moment(startDate);
      endDate = mom.add(value, units).toDate();
    }

    // if endDate is in the future, reset with endDate to now
    if(endDate.getTime() > now.getTime()){
      endDate = new Date();
      mom = moment(endDate);
      startDate = mom.subtract(value, units).toDate();
      this.stepForwardDisabled = true;
    } else {
      this.stepForwardDisabled = false;
    } 

     return {
      start: startDate.getTime(),
      end: endDate.getTime(),
      step:'10'
    }
  }

  fetchReportData(rrdOptions, report:Report, identifier?: string){
    // Report options
    let params = identifier ? { name: report.name, identifier: identifier} : { name: report.name };

    // Time scale options
    const start = Math.floor(rrdOptions.start / 1000);
    const end = Math.floor(rrdOptions.end / 1000);
    let timeFrame = {"start": start, "end": end}; 
    //let timeFrame = {"unit": "WEEK"};// 'HOUR', 'DAY', 'WEEK', 'MONTH', 'YEAR'
    //console.log([[params], timeFrame]);

    this.ws.call('reporting.get_data', [[params],timeFrame]).subscribe((res) =>{
      if(this.report.name == "cputemp"){
        console.log(res);
        let command = [{
          command: 'avgCpuTempReport',
          input: res[0]
        }]

        this.utils.postMessage({name:'ProcessCommands', data: command, sender: this.chartId});
        
      } else {
        this.data = res[0];
      }
    });
  }

  // Will be used for back of flip card
  setPreferences(form:NgForm){
    let filtered: string[] = [];
    for(let i in form.value){
      if(form.value[i]){
        filtered.push(i);
      }
    }
  }

}
