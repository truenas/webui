import { Component, AfterViewInit, Input, ViewChild, OnDestroy} from '@angular/core';
import { CoreServiceInjector } from 'app/core/services/coreserviceinjector';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { MaterialModule } from 'app/appMaterial.module';
import { NgForm } from '@angular/forms';
import { ChartData } from 'app/core/components/viewchart/viewchart.component';

import { Router } from '@angular/router';
import { UUID } from 'angular2-uuid';
import * as d3 from 'd3';
import * as c3 from 'c3';

import filesize from 'filesize';
import { WidgetChartComponent, TimeData } from 'app/core/components/widgets/widgetchart/widgetchart.component';
import { TranslateService } from '@ngx-translate/core';

import { T } from '../../../../translate-marker';

@Component({
  selector: 'widget-cpu-temps',
  templateUrl:'./widgetcputemps.component.html',
  styleUrls: ['./widgetcputemps.component.css']
})
export class WidgetCpuTempsComponent extends WidgetChartComponent implements AfterViewInit, OnDestroy {

  private _totalCores:number;
  get totalCores(){
    return this._totalCores;
  }
  set totalCores(val){
    this._totalCores = val;
    this.registerObservers(val);
  }
  public collectedTemps:any = {};
  public collectedMeta:any = {};

  public title:string = T("CPU Temperatures");
  protected _subtitle:string;
  get subtitle(){
    let value = T("Average of all cores");
    return value;
  }
  set subtitle(val){
    this._subtitle = val;
  }

  //public widgetColorCssVar = "var(--primary)";
  private chartData:CoreEvent;
  public invalidData:boolean = false;

  constructor(public router: Router, public translate: TranslateService){
    super(router, translate);
  }

  ngOnDestroy(){
    this.core.emit({name:"StatsRemoveListener", data:{name:"CpuTemp", obj:this}});
    this.core.unregister({observerClass:this});
  }

  ngAfterViewInit(){
    this.core.emit({name:"SysInfoRequest"});
    this.core.emit({name:"StatsAddListener", data:{name:"CpuTemp", obj:this} });

    this.core.register({observerClass:this,eventName:"SysInfo"}).subscribe((evt:CoreEvent) => {
      this.totalCores = evt.data.cores;
      this.chartSetup();
      if(this.totalCores !== evt.data.cores){
        this.totalCores = evt.data.cores;
      }
    });

  }

  registerObservers(cores){
    for(let i = 0; i < cores; i++){
      this.core.register({observerClass:this,eventName:"StatsCpuTemp"}).subscribe((evt:CoreEvent) => {
        this.loader = false;
        this.setChartData(evt);
      });
    }
  }


  // Collect data for each core as it arrives
  collectData(cpu, data){
    let keys = Object.keys(this.collectedTemps);
    let metaKeys = Object.keys(this.collectedMeta);

    let temps = data.data.map( value => value/100);

    if(keys.length == (this.totalCores - 1) && !this.collectedTemps["cpu-" + cpu]){
      this.dataRcvd = true;
      this.collectedTemps["cpu-" + cpu] = temps;
      let md = this.mergeData();
      this.setChartData({
          name:"",
          data: md
        });
      this.collectedTemps = {};
      this.collectedMeta = {};
      } else if(keys.length < this.totalCores && !this.collectedTemps["cpu-" + cpu]){
        this.collectedTemps["cpu-" + cpu] = temps;
        if(metaKeys.length == 0){
          this.collectedMeta = data.meta;
        }
      }
    }

  mergeData(){
    let mergedData: any[] = [];
    let legend:any[] = Object.keys(this.collectedTemps);
    let dataPoints = this.collectedTemps[legend[0]];

    for(let index = 0; index < dataPoints.length; index++){
      let dp = [];
      for(let i = 0; i < legend.length; i++){
        dp.push(this.collectedTemps[legend[i]][index]);
      }
      mergedData.push(dp);
    }
    let meta = Object.assign({}, this.collectedMeta);
    meta.legend = legend;
    let result:any = {
      data: mergedData,
      meta: meta
    }
    return result;
  }

    chartSetup(){

       this.chart = c3.generate({
         bindto: '#' + this.chartId,
         size: {
           height:225
         },
         data: {
           x: "x",
           columns: [
             ['x'],
             ['average']
           ],
           type: 'spline',
           colors: {
             average: this.widgetColorCssVar //"var(--orange)"// Cant use this.widgetColorCssVar
           },
           onmouseout: (d) => {
             this.showLegendValues = false;
           }
         },
         axis: {
           x: {
             show:false,
             type: 'timeseries',
             tick: {
               count: 2,
               fit:true,
               format: '%HH:%M:%S'
             }
           },
           y: {
             show:true,
             inner:true,
             max: 100,
             tick: {
               count:4,
               values: [25,50,75,100],
               format: (y) => { return y + "°" }
               }
           }
         },
         legend: {
           show: false
         },
         grid: {
           x: {
             show: true
           },
           y: {
             show: true
           }
         },
         tooltip: {
           //show: false,
           contents: (raw, defaultTitleFormat, defaultValueFormat, color) => {
             if(!this.showLegendValues){
               this.showLegendValues = true;
             }
             this.altTitle = "CPU Temperature: " + raw[0].value + "°C";
             this.altSubtitle = raw[0].x;

             return '<div style="display:none">' + raw[0].x + '</div>';
           }
         }
       });
    }

    setChartData(evt:CoreEvent){

      let parsedData = [];
      let dataTypes = [];
      dataTypes = evt.data.meta.legend;

      // populate parsedData
      for(let index in dataTypes){
        let chartData:ChartData = {
          legend: dataTypes[index],
          data:[]
        }
        for(let i in evt.data.data){
          // Convert value from deci-kelvins to celsius
          let converted = (evt.data.data[i][index] / 10) - 273.15;
          chartData.data.push(converted);
        }
        parsedData.push(chartData);
      }

      let xColumn = this.makeTimeAxis(evt.data.meta, parsedData);
      let finalStat = this.aggregateData(evt.data.meta.legend, parsedData, "average");

      this.startTime = this.timeFromDate(xColumn[1]);

      this.endTime = this.timeFromDate(xColumn[xColumn.length - 1]);

      let cols = this.makeColumns([finalStat]);
      cols.unshift(xColumn);
      this.chart.load({
        columns:cols
      })
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

    setPreferences(form:NgForm){
      let filtered: string[] = [];
      for(let i in form.value){
        if(form.value[i]){
          filtered.push(i);
        }
      }
    }

    formatMemory(physmem:number, units:string){
      let result:string;
      if(units == "MiB"){
        result = Number(physmem / 1024 / 1024).toFixed(0)// + ' MiB';
      } else if(units == "GiB"){
        result = Number(physmem / 1024 / 1024 / 1024).toFixed(0)// + ' GiB';
      }
      return Number(result)
    }

}
