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
//import { WidgetComponent } from 'app/core/components/widgets/widget/widget.component';
import { WidgetChartComponent, TimeData } from 'app/core/components/widgets/widgetchart/widgetchart.component';
import { TranslateService } from '@ngx-translate/core';

import { T } from '../../../../translate-marker';

@Component({
  selector: 'widget-cpu-history',
  templateUrl:'./widgetcpuhistory.component.html',
  styleUrls: ['./widgetcpuhistory.component.css']
})
export class WidgetCpuHistoryComponent extends WidgetChartComponent implements AfterViewInit, OnDestroy {

  //@ViewChild('chartCpu') chartCpu: ViewChartLineComponent;
  public title:string = T("CPU Usage");
  public subtitle:string = T("% of all cores");
  //public widgetColorCssVar = "var(--primary)";

  constructor(public router: Router, public translate: TranslateService){
    super(router, translate);
  }

  ngOnDestroy(){
    this.core.emit({name:"StatsRemoveListener", data:{name:"CpuAggregate", obj:this}});
    this.core.unregister({observerClass:this});
  }

  ngAfterViewInit(){
    this.core.emit({name:"StatsAddListener", data:{name:"CpuAggregate",key:"average", obj:this} });

    this.core.register({observerClass:this,eventName:"StatsCpuAggregateAverage"}).subscribe((evt:CoreEvent) => {
      this.setChartData(evt);

    });

    this.chartSetup()
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
           ['total']
         ],
         type: 'spline',
         colors: {
           total: this.widgetColorCssVar
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
             count:3,
             values: [25, 50, 75, 100],
             format: (y) => { return y + "%" }
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
           this.altTitle = "CPU " + raw[0].value + "%";
           this.altSubtitle = raw[0].x;

           return '<div style="display:none">' + raw[0].x + '</div>';
         }
       }
     });
  }

  setChartData(evt:CoreEvent){
    this.dataRcvd = true;
    let parsedData = [];
    let dataTypes = [];
    dataTypes = evt.data.meta.legend;

    for(let index in dataTypes){
      let chartData:ChartData = {
        legend: dataTypes[index],
        data:[]
      }
      for(let i in evt.data.data){
        chartData.data.push(evt.data.data[i][index])
      }
      parsedData.push(chartData);
    }

    let xColumn = this.makeTimeAxis(evt.data.meta, parsedData);

    this.startTime = this.timeFromDate(xColumn[1]);

    this.endTime = this.timeFromDate(xColumn[xColumn.length - 1]);

    let finalStat = this.aggregateData(["user","system","nice","interrupt"], parsedData);
    let cols = this.makeColumns([finalStat]);
    cols.unshift(xColumn);
    this.chart.load({
      columns: cols
    });
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

}
