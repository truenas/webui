import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { WebSocketService, DialogService } from '../../../services/index';
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';

@Component({
  selector: 'app-charts',
  templateUrl: './charts.component.html',
  styleUrls: ['../applications.component.scss']
})
export class ChartsComponent implements OnInit {
  public chartItems = [];
  private dialogRef: any;
  public tempIcon = '/assets/images/ix-original.png';

  constructor(private ws: WebSocketService, private mdDialog: MatDialog,
    private dialogService: DialogService) { }

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
          description: chart.chart_metadata.description,
          update: chart.update_available,
          used_ports: chart.used_ports.join(', ')
        }
        this.chartItems.push(chartObj);
        
      })
    })
  }

  doStart(name: string) {
    console.log(name);
  }

  doStop(name: string) {
    console.log(name);
  }

  doPortal(name: string) {
    console.log(name);
  }

  doDelete(name: string) {
    console.log('delete')
    this.dialogRef = this.mdDialog.open(EntityJobComponent, { data: { 'title': (
      'Deleting') }, disableClose: true});
    this.dialogRef.componentInstance.setCall('chart.release.delete', [name]);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.subscribe((res) => {
      this.dialogService.closeAllDialogs();
      // We should go to chart tab(?) and refresh
      console.log(res);
    });
    this.dialogRef.componentInstance.failure.subscribe((err) => {
      // new EntityUtils().handleWSError(this, err, this.dialogService);
    })
  }

  getConsoleChoices(x) {
    this.ws.call('chart.release.pod_console_choices', [x]).subscribe(res => {
      console.log(res)
    })
  }
 }
