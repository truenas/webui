import { Component, OnInit } from '@angular/core';
import { ViewChartComponent, ViewChartMetadata, ChartData } from 'app/core/components/viewchart/viewchart.component';

@Component({
  selector: 'viewchartpie',
  template:ViewChartMetadata.template,
  //templateUrl: './viewchartpie.component.html',
  styleUrls: ['./viewchartpie.component.css']
})
export class ViewChartPieComponent extends ViewChartComponent implements OnInit {

  constructor() { 
    super();
  }

  ngOnInit() {
  }

}
