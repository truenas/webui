import {Component, Input, OnInit, AfterViewInit, OnDestroy, OnChanges, SimpleChanges, ViewChild, ElementRef} from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { ViewComponent } from 'app/core/components/view/view.component';
import { Report, ReportData } from '../report/report.component';
import { ThemeService, Theme } from 'app/services/theme/theme.service';

import {UUID} from 'angular2-uuid';
import * as moment from 'moment';
import Dygraph from 'dygraphs';
import smoothPlotter from 'dygraphs/src/extras/smooth-plotter.js';
import Chart from 'chart.js';
import 'chartjs-plugin-crosshair';
import * as simplify from 'simplify-js';

// For Chart.js
interface DataSet {
  label: string;
  data: number[];
  backgroundColor: string[];
  borderColor: string[];
  borderWidth: number;
}

@Component({
  selector: 'linechart', 
     templateUrl:'./lineChart.component.html',
     styleUrls:['./lineChart.component.css']
})
export class LineChartComponent extends ViewComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('wrapper', {static: true}) el: ElementRef;
  @Input() data: ReportData;
  @Input() report: Report;
  @Input() title: string;

  @Input() legends?: string[]; 
  @Input() type: string = 'line';
  @Input() convertToCelsius?: true;
  @Input() dataStructure: 'columns'; // rows vs columns
  @Input() minY?: number = 0;
  @Input() maxY?: number = 100;
  @Input() labelY?: string = 'Label Y';
  @Input() interactive: boolean = false;

  public library: string = 'dygraph'; // dygraph or chart.js
    public ctx: any; // canvas context for chart.js

  public chart:any;
  public conf:any;
  public columns:any;
  public linechartData:any;

  public units: string = '';
  public yLabelPrefix: string;
  public showLegendValues: boolean = false;
  public legendEvents: BehaviorSubject<any>;
  public legendLabels: BehaviorSubject<any>;
  public legendAnalytics: BehaviorSubject<any>;

  public colorPattern = ["#2196f3", "#009688", "#ffc107", "#9c27b0", "#607d8b", "#00bcd4", "#8bc34a", "#ffeb3b", "#e91e63", "#3f51b5"];
  public theme: Theme;
  public timeFormat: string = "%H:%M";
  public culling:number = 6;
  public controlUid: string;

  constructor(private core:CoreService, public themeService:ThemeService) {
    super();
    this.controlUid = "chart_" + UUID.UUID();
    this.legendEvents = new BehaviorSubject(false);
    this.legendLabels = new BehaviorSubject([]);
    this.legendAnalytics = new BehaviorSubject([]);
  } 

  applyHandledData(columns, linechartData, legendLabels){
    this.columns = columns;
    this.linechartData = linechartData;
    this.legendLabels.next(legendLabels);

  }

  public render(){

    if(this.library == 'dygraph'){
      // Use dygraph for line graphs with large data sets
      this.renderGraph();
    } else if(this.library == 'chart.js'){
      // Use chart.js for everything else
      this.renderChart();
    } 
  }

  // dygraph renderer
  public renderGraph(){
    let data = this.makeTimeAxis(this.data);
    let labels = data.shift();

    let fg2RGB = this.themeService.hexToRGB(this.themeService.currentTheme().fg2);
    let gridLineColor = 'rgba(' + fg2RGB.rgb[0] + ', ' + fg2RGB.rgb[1]+ ', ' + fg2RGB.rgb[2]+ ', 0.25)'

    let options = {
       drawPoints:false,// Must be disabled for smoothPlotter
       pointSize:1,
       highlightCircleSize:4,
       strokeWidth:1,
       colors: this.colorPattern,
       labels: labels,// time axis
       ylabel: this.yLabelPrefix + this.labelY,
       gridLineColor: gridLineColor,
       showLabelsOnHighlight: false,
       labelsSeparateLines: true,
       axes: {
         y:{
           yRangePad: 24,
           axisLabelFormatter: ( numero, granularity, opts, dygraph  ) => {
             let test = this.formatLabelValue(numero, this.inferUnits(this.labelY), true,1);
             return test[0];
           },
         }
       },
       legendFormatter: (data) => {
         let clone = Object.assign({}, data);
         clone.series.forEach((item, index) => {
           if(!item.y){ return; }
           let formatted = this.formatLabelValue(item.y, this.inferUnits(this.labelY), true, 1);
           clone.series[index].yHTML = formatted[0].toString();
        
         });
         this.legendEvents.next(clone);
         return "";
       },
       series: () => {
         let s = {};
         this.data.legend.forEach((item, index) => {
           s[item] = {plotter: smoothPlotter};
         });

         return s;
       },
       drawCallback: (dygraph, is_initial) =>{
         if(dygraph.axes_){
          let numero = dygraph.axes_[0].maxyval;
          let test = this.formatLabelValue(numero, this.inferUnits(this.labelY));
          if(test[1]){
            this.yLabelPrefix = test[1];
          } else {
            this.yLabelPrefix = '';
          }
         } else {
          console.warn("axes not found");
         }
       }
     }
      this.chart = new Dygraph(this.el.nativeElement, data, options);
  }

  // chart.js renderer
  public renderChart(){
    if(!this.ctx){
      const el = this.el.nativeElement.querySelector('canvas');
      if(!el){ return; }

      const ds = this.makeDatasets(this.data);
      this.ctx = el.getContext('2d');

      let data = {
        labels: this.makeTimeAxis(this.data),//this.data.legend,
        datasets: ds ,
      }

      let options = {
        plugins: {
          crosshair: {
            line: {
              width: 1,
              color: '#666'
            },
            sync: {
              enabled: true
            },
            zoom : {
              enabled: true
            },
            callbacks: {
              afterZoom: (start, end) => {
              }
            }
          }
        },
        tooltips:{
          enabled: true,
          callbacks: { 
            label: (evt, data) =>{
              //console.log(evt);
              }
          }
        },
        //showLines: false,
        responsive:true,
        maintainAspectRatio: false,
        legend: {
          display: false
        },
        responsiveAnimationDuration: 0,
        animation: {
          duration: 0
        },
        hover: {
          animationDuration: 0 
        },
        elements: {
          line: {
            tension: 0
          }
        },
        scales: {
          xAxes: [{
            type: 'time',
            display: true,
            scaleLabel: {
              display: false,
              labelString: 'Date'
            },
          }],
          yAxes: [{
            ticks: {
              beginAtZero: true
            }
          }]
        }
      }

      this.chart = new Chart(this.ctx, {
        type: this.type,
        data:data,
        options
      });

    } else {

      const ds = this.makeDatasets(this.data);
      let data = {
        labels: this.makeTimeAxis(this.data, ds[0].data),//this.data.legend,
        datasets: ds ,
      }
      this.chart.data = data;

      this.chart.update();

    }
  }

  makeColumn(data:ReportData, legendKey): number[]{
    let result = [];

    for(let i = 0; i < data.data.length; i++){
      const value = data.data[i][legendKey];
      result.push(value);
    }

    return result;
  }

  protected makeDatasets(data:ReportData): DataSet[]{

    let datasets = [];
    let legend = Object.assign([],data.legend);

    // Create the data...
    legend.forEach((item, index) => {

      let ds:DataSet = {
        label: item,
        data:this.makeColumn(data, index),
        backgroundColor: [], 
        borderColor: [this.colorPattern[index]],
        borderWidth: 1
      }

      datasets.push(ds);
    });

    return datasets
  }

  protected makeTimeAxis(rd:ReportData, data?: number[]):any[]{
    if(!data){ data = rd.data; }

      const structure = this.library == 'chart.js' ? 'columns' : 'rows'
        if(structure == 'rows'){
          // Push dates to row based data...
          let rows = [];
          // Add legend with axis to beginning of array
          let legend = Object.assign([],rd.legend);
          legend.unshift('x');
          rows.push(legend);

          for(let i = 0; i < rd.data.length; i++){ 
            let item = Object.assign([], rd.data[i]);
            let date = new Date(rd.start * 1000 + i * rd.step * 1000);
            item.unshift(date);
            rows.push(item);
          }

          return rows;
        } else if(structure == 'columns'){

          let columns = [];

          for(let i = 0; i < rd.data.length; i++){ 
            let date = new Date(rd.start * 1000 + i * rd.step * 1000);
            columns.push(date);
          }

          return columns;
        }

  }

  private processThemeColors(theme):string[]{
    this.theme = theme;
    let colors: string[] = [];
    theme.accentColors.map((color) => {
      colors.push(theme[color]);
    }); 
    return colors;
  }

  private createColorObject(){
    let obj = {};
    this.legends.forEach((item, index)=>{
      obj[item] = this.colorPattern[index]
    })
    return obj;
  }

  public fetchData(rrdOptions, timeformat?: string, culling?:number){
    if(timeformat){
      this.timeFormat = timeformat;
    }
    if(culling){
      this.culling = culling;
    }

    // Convert from milliseconds to seconds for epoch time
    rrdOptions.start = Math.floor(rrdOptions.start / 1000);
    if(rrdOptions.end){
      rrdOptions.end = Math.floor(rrdOptions.end / 1000);
    }

  }

  inferUnits(label:string){
    // Figures out from the label what the unit is
    let units = label;
    if(label.includes('%')){
      units = '%';
    } else if(label.includes('°')){
      units = "°";
    } else if(label.toLowerCase().includes("bytes")){
      units = "bytes";
    } else if(label.toLowerCase().includes("bits")){
      units = "bits";
    }

    if(typeof units == 'undefined'){
      console.warn("Could not infer units from " + this.labelY);
    } 
    
    return units;
  }

  formatLabelValue(value: number, units: string, prefixRules?: boolean, fixed?: number){
    let result;
    if(!fixed){ fixed = -1; }
    
    switch(units.toLowerCase()){
      case "bits":
        result  = this.convertKMGT(value, prefixRules, fixed);
        break;
      case "bytes":
        result = this.convertKMGT(value, prefixRules, fixed);
        break;
      case "%":
      case "°":
      default:
        result = [value];
        return [this.limitDecimals(value), ''];
        //break;
    }

    return result ? result : [value];
  }

  limitDecimals(numero: number){
    let subZero = numero.toString().split(".");
    let decimalPlaces = subZero && subZero[1] ? subZero[1].length : 0;
    return decimalPlaces > 2 ? numero.toFixed(2) : numero;
  }

  convertKMGT(value: number, prefixRules?: boolean, fixed?: number): string[]{
    const kilo = 1024;
    const mega = kilo * 1024;
    const giga = mega * 1024;
    const tera = giga * 1024;

    let prefix: string = '';
    let converted: number = value;

    if(value > tera || (prefixRules && this.yLabelPrefix == 'Tera')){
      prefix = "Tera";
      converted = value / tera;
    } else if((value < tera && value > giga) || (prefixRules && this.yLabelPrefix == 'Giga')){
      prefix = "Giga";
      converted = value / giga;
    } else if((value < giga && value > mega) || (prefixRules && this.yLabelPrefix == 'Mega')){
      prefix = "Mega";
      converted = value / mega;
    } else if((value < mega && value > kilo || (prefixRules && this.yLabelPrefix == 'Kilo'))){
      prefix = "Kilo";
      converted = value / kilo;
    }
 
    if(fixed && fixed !== -1){
      return [converted.toFixed(fixed), prefix];
    } else {
      return [converted.toString(), prefix];
    }
  }


  // LifeCycle Hooks
  ngOnInit() {

    this.core.register({ observerClass:this, eventName:"ThemeData" }).subscribe((evt:CoreEvent)=>{ 
      this.colorPattern = this.processThemeColors(evt.data);

      if(this.data || this.linechartData){ 
        this.render();
      }
    });

    this.core.register({ observerClass:this, eventName:"ThemeChanged" }).subscribe((evt:CoreEvent)=>{ 
      this.colorPattern = this.processThemeColors(evt.data);
      if(this.data || this.linechartData){ 
        this.render();
      }
    });

    this.core.emit({name:"ThemeDataRequest"});
  }

  ngAfterViewInit() {
    this.render();
  }

  ngOnChanges(changes:SimpleChanges){
    if(changes.data){
      if(this.chart){
        this.render();
      } else {
        this.render();// make an update method?
      }
    }
  }

  ngOnDestroy(){
    this.core.unregister({observerClass:this});
    if(this.library == 'dygraph'){
      this.chart.destroy();
    }
  }

}
