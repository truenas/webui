import {
  OnInit, Component, ViewEncapsulation, Inject,
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import helptext from 'app/helptext/apps/apps';
import { LocaleService } from 'app/services/locale.service';

@Component({
  selector: 'catalog-summary-dialog',
  styleUrls: ['./catalog-summary-dialog.component.scss'],
  templateUrl: './catalog-summary-dialog.component.html',
  encapsulation: ViewEncapsulation.None,
})

export class CatalogSummaryDialog implements OnInit {
  catalogApp: any;
  statusOptions: string[] = ['All', 'Healthy', 'Unhealthy'];
  helptext = helptext;
  selectedStatus: string = this.statusOptions[0];
  filteredVersions: any;

  constructor(
    public dialogRef: MatDialogRef<CatalogSummaryDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    protected localeService: LocaleService,
  ) {
    this.catalogApp = data;
  }

  ngOnInit(): void {
    this.filteredVersions = this.catalogApp.versions;
  }

  onStatusOptionChanged(): void {
    this.filteredVersions = {};
    Object.keys(this.catalogApp.versions).forEach((key) => {
      const version = this.catalogApp.versions[key];
      if (
        this.selectedStatus == this.statusOptions[0]
        || this.selectedStatus == this.statusOptions[1]
        && version.healthy
        || this.selectedStatus == this.statusOptions[2]
        && !version.healthy
      ) {
        this.filteredVersions[key] = version;
      }
    });
  }

  hasFilterResult(): boolean {
    return Object.keys(this.filteredVersions).length > 0;
  }

  versionStatusLabel(version: any): string {
    let label = '';
    if (this.selectedStatus == this.statusOptions[0]) {
      if (version.value.healthy) {
        label += '(Healthy)';
      } else {
        label += '(Unhealthy)';
      }
    }

    return label;
  }
}
