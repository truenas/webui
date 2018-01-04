import { Component, AfterViewInit, OnChanges } from '@angular/core';
import { ViewComponent } from 'app/core/components/view/view.component';
import {UUID} from 'angular2-uuid';
import * as c3 from 'c3';

export interface ChartData {
  legend: string;
  data: any[];
}

@Component({
  selector: 'viewchart',
  templateUrl: './viewchart.component.html',
  styleUrls: ['./viewchart.component.css']
})
export class ViewChartComponent extends ViewComponent implements AfterViewInit {

  public chartType: string = 'pie';
  public chartColors: string[];
  public maxLabels: number;
  public units: string;
  public width: number;
  public height: number;

  protected chart: any;
  protected _data: any[];
  protected _chartId: string;
  private validChartTypes: string[] = [
    'pie',
    'bar',
    'donut',
    'gauge'
  ]

  constructor() { 
    super();
    this._chartId = "chart-" + UUID.UUID();
  }

  ngAfterViewInit() {
    this.render();
  }

  ngOnChanges() {
    console.log("OnChanges");
    this.render();
  }

  set data(d:ChartData[]){
    let result: any[] = [];
    for(let i = 0; i < d.length; i++){
      let item = d[i];
      let legend = [item.legend];
      let dataObj = legend.concat(item.data)
        result.push(dataObj);
    }
    this._data = result;
    this.render();
  }

  get data(){
    return this._data;
  }

  get chartId(){
    return this._chartId;
  }

  set chartId(sel: string){
    this._chartId = sel;
  }

  render(){
    if(this.data.length == 0){
      return -1;
    }
    
    this.chart = c3.generate({
      bindto: '#' + this._chartId,
      data: {
        columns: this._data,
        type: this.chartType
      },
      size:{
        width: this.width,
        height: this.height
      }
    })
  }

}
