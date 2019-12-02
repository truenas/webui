import { Component, AfterViewInit, Input, ViewChild, OnDestroy} from '@angular/core';
import { CoreServiceInjector } from 'app/core/services/coreserviceinjector';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { MaterialModule } from 'app/appMaterial.module';
import { NgForm } from '@angular/forms';
import { ChartData } from 'app/core/components/viewchart/viewchart.component';

import { Router } from '@angular/router';
import { UUID } from 'angular2-uuid';
import * as d3 from 'd3';

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

@Component({
  selector: 'widget-chart',
  templateUrl:'./widgetchart.component.html',
  styleUrls: ['./widgetchart.component.scss']
})
export class WidgetChartComponent extends WidgetComponent implements AfterViewInit, OnDestroy {

  // Labels
  public title:string = T("CPU Usage");
  public subtitle:string = T("% of all cores");
  public altTitle: string = '';
  public altSubtitle: string = '';
  public widgetColorCssVar: string = 'var(--warn)';

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
  public chart: any;
  public maxY: number = 100; // Highest number in data
  public startTime;
  public endTime;

  constructor(public router: Router, public translate: TranslateService){
    super(translate);

    setTimeout(() => {
      if(!this.dataRcvd){
        this.loader = true;
      }
    }, 5000)
    let theme = this.themeService.currentTheme();
    this.widgetColorCssVar = theme[this.themeService.colorFromMeta(theme.primary)];
  }

  ngOnDestroy(){
    this.core.unregister({observerClass:this});
  }

  ngAfterViewInit(){ 
  }

  //Override this method in subclasses
  chartSetup(){
  }

  setChartData(evt:CoreEvent){
  }

  protected makeTimeAxis(td:TimeData, data:any,  axis?: string):any[]{
    if(!axis){ axis = 'x';}
      let labels: any[] = [axis];
    data[0].data.forEach((item, index) =>{
      let date = new Date(td.start * 1000 + index * td.step * 1000);
      labels.push(date);
    });

    return labels;
  }


  timeFromDate(date:Date){
    let hh = date.getHours().toString();
    let mm = date.getMinutes().toString();
    let ss = date.getSeconds().toString();

    if(hh.length < 2){
      hh = "0" + hh
    }
    if(mm.length < 2){
      mm = "0" + mm
    }
    if(ss.length < 2){
      ss = "0" + ss
    }
    return hh + ":" + mm + ":" + ss;
  }

  aggregateData(wanted:string[], parsedData:ChartData[], operation?:string){
    // operation options: total(default) or average
    if(!operation){
      operation = "total";
    }
    let result:ChartData = {
      legend:operation,
      data:[]
    }
    result.data.length = parsedData[0].data.length;
    result.data.fill(Number(0));

    for(let index = 0; index < parsedData.length; index++){
      let stat = parsedData[index].data;
      let isWanted = wanted.indexOf(parsedData[index].legend);
      if(isWanted !== -1){
        for(let i = 0; i < stat.length; i++){
          let newNumber = Number(result.data[i]) + Number(stat[i]);
          result.data[i] = newNumber.toFixed(2);
        }
      }
    }

    if(operation && operation == "average"){
     let average: any[] = [];
     for(let a = 0; a < result.data.length; a++ ){
       let dataPoint = result.data[a] / wanted.length;
       average.push(Number(dataPoint).toFixed(2))
     }
     result.data = average;
    }
    return result;
  }

  makeColumns(parsedData:ChartData[]){
    let columns:any[] = [];
    for(let i = 0; i < parsedData.length; i++){
      let stat = parsedData[i].data;
      stat.unshift(parsedData[i].legend)
      columns.push(stat);
    }
    return columns;
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
