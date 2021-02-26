import { OnInit, Component, ViewEncapsulation, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ApplicationsService } from '../../applications.service';
import  helptext  from '../../../../helptext/apps/apps';
import { LocaleService } from 'app/services/locale.service';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';

@Component({
  selector: 'chart-events-dialog',
  styleUrls: ['./chart-events-dialog.component.scss'],
  templateUrl: './chart-events-dialog.component.html',
  encapsulation: ViewEncapsulation.None,
})

export class ChartEventsDialog implements OnInit {
  public catalogApp: any;
  public containerImages: any[] = [];
  public chartEvents:any[] = [];
  public pods:any[] = [];
  public deployments:any[] = [];
  public statefulsets:any[] = [];

  helptext = helptext;

  constructor(
    public dialogRef: MatDialogRef<ChartEventsDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    protected localeService: LocaleService,
    private loader:AppLoaderService,
    private appService: ApplicationsService) { 
    this.catalogApp = data;
    if (!this.catalogApp.used_ports) {
      this.catalogApp.used_ports = helptext.chartEventDialog.noPorts;
    }
  }

  ngOnInit() {
    const chartQueryPromise = this.appService.getChartReleaseWithResources(this.catalogApp.name).toPromise();
    const chartEventPromise = this.appService.getChartReleaseEvents(this.catalogApp.name).toPromise();

    this.loader.open();
    Promise.all([chartQueryPromise, chartEventPromise]).then(
      (res) => {
        this.loader.close();
        if (res[0]) {
          this.containerImages = res[0][0].resources.container_images;
          this.pods = res[0][0].resources.pods;
          this.deployments = res[0][0].resources.deployments;
          this.statefulsets = res[0][0].resources.statefulsets;
        }
        if (res[1]) {
          this.chartEvents = res[1];
        }
      }
    );
  }

  //return the container image status
  containerImageStatus(containerImage: any) {
    if (containerImage.value.update_available) {
      return helptext.chartEventDialog.statusUpdateAvailable;
    } else {
      return helptext.chartEventDialog.statusUpToDate;
    }
  }

  //return the chart app status
  appStatus() {

    let label: string;
    if (!this.catalogApp.update_available && !this.catalogApp.container_images_update_available) {
      label = helptext.chartEventDialog.statusUpToDate;
    } else if ( this.catalogApp.update_available || this.catalogApp.container_images_update_available) {
      label = helptext.chartEventDialog.statusUpdateAvailable;
    }
    return label;
  }

  //return the tooltip string for the version availabe to update
  getUpdateVersionTooltip() {
    let label: string;
    if ( this.catalogApp.update_available ) {
      label = helptext.chartEventDialog.statusUpdateAvailableTo + this.catalogApp.human_latest_version;
    } else if (this.catalogApp.container_images_update_available) {      
      label = helptext.chartEventDialog.containerImageStatusUpdateAvailableTo;
      const updateAvailableImages = Object.keys(this.containerImages).filter(imageName=>this.containerImages[imageName].update_available);
      label += updateAvailableImages.join(",");
    }
    
    return label;
  }
}
