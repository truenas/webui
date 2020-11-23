import { Component, OnInit } from '@angular/core';
import { WebSocketService, DialogService } from '../../../services/index';

@Component({
  selector: 'app-charts',
  templateUrl: './charts.component.html',
  styleUrls: ['../applications.component.scss']
})
export class ChartsComponent implements OnInit {
  public chartItems = [];

  constructor(private ws: WebSocketService) { }

  ngOnInit(): void {

    this.ws.call('chart.release.query').subscribe(charts => {
      console.log(charts)
      charts.forEach(chart => {
        let chartObj = {
          name: chart.name,
          catalog: chart.catalog,
          train: chart.train,
          status: chart.info.status,
          first_deployed: chart.info.first_deployed, 
          version: chart.chart_metadata.version,
          description: chart.chart_metadata.description
        }
        this.chartItems.push(chartObj);
        
      })
    })
  }
}
