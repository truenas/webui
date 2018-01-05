import { Component, OnInit } from '@angular/core';
import { ViewChartComponent, ViewChartMetadata } from 'app/core/components/viewchart/viewchart.component';
import * as c3 from 'c3';

@Component({
  selector: 'viewchartline',
  template:ViewChartMetadata.template
})
export class ViewChartLineComponent extends ViewChartComponent implements OnInit {

  private _tooltipHeight:string;

  constructor() { 
    super();
  }

  ngOnInit() {
  }

  set tooltipHeight(tth:string){
    this._tooltipHeight = tth + 'px';
  }

  get tooltipHeight(){
    return this._tooltipHeight;
  }

  render(){
    if(this.data.length == 0){
      return -1;
    }

    this.chart = c3.generate({
      bindto: '#' + this._chartId,
      grid: {
        x: {
          show: false
        },
        y: {
          show: true
        }
      },
      axis: {
        x: {
          type: this.chartType, // eg. 'timeseries'
          padding:{
            left:0,
            right:0
          },
          tick: {
            format: '%H:%M:%S',
            fit: true,
            culling: {
              max: 5
            }
          }
        },
        y:{
          inner:false
        }
      },
      data: {
        columns: this._data
      },
      size:{
        //width: this.width,
        //height: this.height
        },
      subchart: {
        show: true,
        size:{
          height:32
        }
      },
      zoom:{
        enabled: true
      },
      legend:{
        position:'top',
        show:false
      },
      tooltip:{
        grouped:true,
        position:(data, width, height, element) => {
          let x = (parseInt(element.getAttribute('x')));
          let y = 0;
          let w = (parseInt(element.getAttribute('width')));
          let h = (parseInt(element.getAttribute('height')));

          let left = x + (w/2);
          this.tooltipHeight = String((h*0.8));
          return {top: y, left: left}
        },
        contents: (d, defaultTitleFormat, defaultValueFormat, color) => {
          d = Math.floor(d[0].value)
          return '<div id="tooltip" class="module-triangle-bottom" style="height:' + this.tooltipHeight + ';border-top:solid 3px;">' + d + '</div>'
        },
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
    })
  }

}
