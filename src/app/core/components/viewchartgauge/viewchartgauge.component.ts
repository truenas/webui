import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ViewChartComponent, ViewChartMetadata } from 'app/core/components/viewchart/viewchart.component';
import * as c3 from 'c3';

export interface GaugeConfig {
  label: boolean; // to turn off the min/max labels.
  units: string;
  min?: number; // 0 is default, //can handle negative min e.g. vacuum / voltage / current flow / rate of change
  max?: number; // 100 is default
  width?: number; // for adjusting arc thickness
  data: any;
}

@Component({
  selector: 'viewchartgauge',
  //template:ViewChartMetadata.template
  templateUrl: './viewchartgauge.component.html',
  //styleUrls: ['./viewchartdonut.component.css']
})
export class ViewChartGaugeComponent extends ViewChartComponent implements OnInit, OnChanges {

  public title:string = '';
  public chartType: string = 'gauge';

  private gaugeConfig: GaugeConfig = {
    label: true,
    units: this.units,
    data: []
  }

  @Input() config: GaugeConfig;

  constructor() { 
    super();
  }

  ngOnChanges(changes: SimpleChanges) {
    if(changes.config){
      if(changes.config.currentValue && changes.config.currentValue.data){
        console.log(changes.config.currentValue.data);
        this.data = changes.config.currentValue.data;
        if(!this.chart){
          console.log("No chart");
          console.log(this.data);
          this.render();
        } else {
          console.log("Chart");
          this.chart.load({
            columns: changes.config.currentValue.data
          });
        }
      }
    }
  }

  ngOnInit() {
  }

  get data(){
    return this._data
  }

  set data(d){
    this._data = d;
  }

  makeConfig(){
  
    this.chartConfig = {
      bindto: '#' + this._chartId,
      data: {
        //columns: this._data,
        columns: this.config.data,
        type: this.chartType
      },
      gauge:{
        label:{
          //show: this.gaugeConfig.label
          show: false
        },
        width:15,
        fullCircle:true
      },
      size:{
        width: this.config.width,
        height: this.config.width
      },
      tooltip:{
        show: false,
        /*format: {
          value: (value, ratio, id, index) => {
            if(this.units){
              console.log("Units = " + this.units)
              return value + this.units; 
            } else {
              return value;
            }
          }
        }*/
      }
    }

    return this.chartConfig;
  }



}
