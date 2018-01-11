import { Component, OnInit } from '@angular/core';
import { ViewChartComponent, ViewChartMetadata } from 'app/core/components/viewchart/viewchart.component';
import * as c3 from 'c3';

export interface GaugeConfig {
  label: boolean; // to turn off the min/max labels.
  units: string;
  min?: number; // 0 is default, //can handle negative min e.g. vacuum / voltage / current flow / rate of change
  max?: number; // 100 is default
  width?: number; // for adjusting arc thickness
}

@Component({
  selector: 'viewchartgauge',
  template:ViewChartMetadata.template
  //templateUrl: './viewchartpie.component.html',
  //styleUrls: ['./viewchartdonut.component.css']
})
export class ViewChartGaugeComponent extends ViewChartComponent implements OnInit {

  public title:string = '';
  public chartType: string = 'gauge';

  private gaugeConfig: GaugeConfig = {
    label: true,
    units: this.units
  }

  constructor() { 
    super();
  }

  ngOnInit() {
  }

  makeConfig(){
  
    this.chartConfig = {
      bindto: '#' + this._chartId,
      data: {
        columns: this._data,
        type: this.chartType
      },
      gauge:{
        label:{
          show: this.gaugeConfig.label
        }
      },
      size:{
        //width: this.width,
        height: this.height
      },
      tooltip:{
        format: {
          value: (value, ratio, id, index) => {
            if(this.units){
              console.log("Units = " + this.units)
              return value + this.units; 
            } else {
              return value;
            }
          }
        }
      }
    }

    return this.chartConfig;
  }

}
