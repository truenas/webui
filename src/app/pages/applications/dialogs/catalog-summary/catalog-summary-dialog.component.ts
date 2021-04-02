import { OnInit, Component, ViewEncapsulation, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ApplicationsService } from '../../applications.service';
import  helptext  from '../../../../helptext/apps/apps';
import { LocaleService } from 'app/services/locale.service';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';

@Component({
  selector: 'catalog-summary-dialog',
  styleUrls: ['./catalog-summary-dialog.component.scss'],
  templateUrl: './catalog-summary-dialog.component.html',
  encapsulation: ViewEncapsulation.None,
})

export class CatalogSummaryDialog implements OnInit {
  public catalogApp: any;
  public statusOptions: string[] = ['All', 'Healthy', 'Unhealthy'];
  helptext = helptext;
  public selectedStatus: string = this.statusOptions[0];
  public filteredVersions: object;
  
  constructor(
    public dialogRef: MatDialogRef<CatalogSummaryDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    protected localeService: LocaleService,
    private loader:AppLoaderService,
    private appService: ApplicationsService) { 
    this.catalogApp = data;
  }

  ngOnInit() {
    this.filteredVersions = this.catalogApp.versions;
  }

  onStatusOptionChanged() {
    this.filteredVersions = {};
    Object.keys(this.catalogApp.versions).forEach(key => {
      const version = this.catalogApp.versions[key];
      if (this.selectedStatus == this.statusOptions[0] || this.selectedStatus == this.statusOptions[1] && version.healthy || this.selectedStatus == this.statusOptions[2] && !version.healthy) {
        this.filteredVersions[key] = version;
      }
    });
  }

  hasFilterResult() {
    return Object.keys(this.filteredVersions).length > 0;
  }

  versionStatusLabel(version) {
    let label = '';
    if (this.selectedStatus == this.statusOptions[0]) {
      if (version.value.healthy) {
        label += "(Healthy)";
      } else {
        label += "(Unhealthy)";
      }
    }

    return label;
  }
}
