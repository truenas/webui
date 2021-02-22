import { OnInit, Component, ViewEncapsulation, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ApplicationsService } from '../../applications.service';
import  helptext  from '../../../../helptext/apps/apps';
import { LocaleService } from 'app/services/locale.service';


@Component({
  selector: 'chart-events-dialog',
  styleUrls: ['./chart-events-dialog.component.scss'],
  templateUrl: './chart-events-dialog.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class ChartEventsDialog implements OnInit {
  public catalogApp;
  public containerImages = [];
  public chartEvents = [];
  public pods = [];
  public deployments = [];
  public statefulsets = [];

  helptext = helptext;

  constructor(
    public dialogRef: MatDialogRef<ChartEventsDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    protected localeService: LocaleService,
    private appService: ApplicationsService) { 
    this.catalogApp = data;
    if (!this.catalogApp.used_ports) {
      this.catalogApp.used_ports = helptext.chartEventDialog.noPorts;
    }
  }

  ngOnInit() {
    this.appService.getChartReleaseWithResources(this.catalogApp.name).subscribe(res => {
      if (res) {
        this.containerImages = res[0].resources.container_images;
        this.pods = res[0].resources.pods;
        this.deployments = res[0].resources.deployments;
        this.statefulsets = res[0].resources.statefulsets;
      }
    });
    this.appService.getChartReleaseEvents(this.catalogApp.name).subscribe(res => {
      if (res) {
        this.chartEvents = res;
      }
    });
  }
}
