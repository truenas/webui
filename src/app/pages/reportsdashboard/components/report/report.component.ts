import { Component, AfterViewInit, Input, ViewChild, OnDestroy, OnChanges} from '@angular/core';
import { CoreServiceInjector } from 'app/core/services/coreserviceinjector';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { MaterialModule } from 'app/appMaterial.module';
import { Subject } from 'rxjs/Subject';
import { NgForm } from '@angular/forms';
import { ChartData } from 'app/core/components/viewchart/viewchart.component';
import { LineChartComponent } from 'app/components/common/lineChart/lineChart.component';

import { Router } from '@angular/router';
import { UUID } from 'angular2-uuid';



import filesize from 'filesize';
import { WidgetComponent } from 'app/core/components/widgets/widget/widget.component';
import { TranslateService } from '@ngx-translate/core';

import { T } from '../../../../translate-marker';

export interface TimeData {
  start: number;
  end: number;
  step: number;
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

@Component({
  selector: 'report',
  templateUrl:'./report.component.html',
  styleUrls: ['./report.component.css']
})
export class ReportComponent extends WidgetComponent implements AfterViewInit, OnChanges ,OnDestroy {

  //Chart
  @ViewChild(LineChartComponent) lineChart:LineChartComponent;

  // Labels
  @Input() title:string = T("CPU Usage");
  @Input() lineChartConfig;
  public legendLabels: Subject<any> = new Subject();
  public subtitle:string = T("% of all cores");
  public altTitle: string = '';
  public altSubtitle: string = '';
  public widgetColorCssVar: string = 'var(--primary)';

  public timeZoomIndex:number = 4;
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
  //public showLegendValues:boolean = false;
  public chartId = "chart-" + UUID.UUID();

  public startTime;
  public endTime;

  constructor(public router: Router, public translate: TranslateService){
    super(translate);

    setTimeout(() => {
      if(!this.dataRcvd){
        this.loader = true;
      }
    }, 5000)
  }

  ngOnDestroy(){
    this.core.unregister({observerClass:this});
  }

  ngAfterViewInit(){ 
    this.lineChart.legendEvents.subscribe((evt:any) => {
      //console.log(evt);
      //console.log(this.lineChart.colorPattern);
      //console.log(this.lineChartConfig.legends);
      });
  }

  ngOnChanges(changes){
    if(changes.lineChartConfig){
    }
  }

  timeZoomIn(){
    // more detail
    const max = 4; 
    if(this.timeZoomIndex == max){ return;}
    this.timeZoomIndex += 1;
    const zoom = this.zoomLevels[this.timeZoomIndex]
    this.lineChart.fetchData('now-' + zoom.timespan, zoom.timeformat, zoom.culling);
  }

  timeZoomOut(){
    // less detail
    const min = Number(0);
    if(this.timeZoomIndex == min){ return;}
    this.timeZoomIndex -= 1;
    const zoom = this.zoomLevels[this.timeZoomIndex]
    this.lineChart.fetchData('now-' + zoom.timespan, zoom.timeformat);
  }

  setChartData(evt:CoreEvent){
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
