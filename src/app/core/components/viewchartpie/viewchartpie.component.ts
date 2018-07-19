import { Component, OnInit } from '@angular/core';
import { ViewChartComponent, ViewChartMetadata, ChartData } from '../viewchart/viewchart.component';
import { ViewChartDonutComponent } from '../viewchartdonut/viewchartdonut.component';

@Component({
  selector: 'viewchartpie',
  template:ViewChartMetadata.template,
  //templateUrl: './viewchartpie.component.html',
  styleUrls: ['./viewchartpie.component.css']
})
export class ViewChartPieComponent extends ViewChartDonutComponent implements OnInit {

  public chartType:string = "pie"

  constructor() { 
    super();
  }

  ngOnInit() {
  }

}
