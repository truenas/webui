import { Component, OnInit } from '@angular/core';
import { ViewChartComponent, ViewChartMetadata, ChartData } from 'app/core/components/viewchart/viewchart.component';
import { ViewChartDonutComponent } from 'app/core/components/viewchartdonut/viewchartdonut.component';

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
