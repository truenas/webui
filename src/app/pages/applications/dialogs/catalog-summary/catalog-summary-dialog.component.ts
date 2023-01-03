import {
  OnInit, Component, ViewEncapsulation, Inject,
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import helptext from 'app/helptext/apps/apps';
import { CatalogApp, CatalogAppVersion } from 'app/interfaces/catalog.interface';

@Component({
  selector: 'ix-catalog-summary-dialog',
  styleUrls: ['./catalog-summary-dialog.component.scss'],
  templateUrl: './catalog-summary-dialog.component.html',
  // eslint-disable-next-line @angular-eslint/use-component-view-encapsulation
  encapsulation: ViewEncapsulation.None,
})

export class CatalogSummaryDialogComponent implements OnInit {
  catalogApp: CatalogApp;
  statusOptions: string[] = ['All', 'Healthy', 'Unhealthy'];
  helptext = helptext;
  selectedStatus: string = this.statusOptions[0];
  filteredVersions: { [version: string]: CatalogAppVersion };

  constructor(
    public dialogRef: MatDialogRef<CatalogSummaryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CatalogApp,
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
        this.selectedStatus === this.statusOptions[0]
        || (this.selectedStatus === this.statusOptions[1] && version.healthy)
        || (this.selectedStatus === this.statusOptions[2] && !version.healthy)
      ) {
        this.filteredVersions[key] = version;
      }
    });
  }

  hasFilterResult(): boolean {
    return Object.keys(this.filteredVersions).length > 0;
  }

  versionStatusLabel(version: { value: CatalogAppVersion }): string {
    let label = '';
    if (this.selectedStatus === this.statusOptions[0]) {
      if (version.value.healthy) {
        label += '(Healthy)';
      } else {
        label += '(Unhealthy)';
      }
    }

    return label;
  }
}
