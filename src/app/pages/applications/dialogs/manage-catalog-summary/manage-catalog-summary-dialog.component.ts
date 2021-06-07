import {
  OnInit, Component, ViewEncapsulation, Inject,
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import helptext from 'app/helptext/apps/apps';
import { ApplicationsService } from 'app/pages/applications/applications.service';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { LocaleService } from 'app/services/locale.service';

@UntilDestroy()
@Component({
  selector: 'manage-catalog-summary-dialog',
  styleUrls: ['./manage-catalog-summary-dialog.component.scss'],
  templateUrl: './manage-catalog-summary-dialog.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class ManageCatalogSummaryDialog implements OnInit {
  catalog: any;
  statusOptions: string[] = ['All', 'Healthy', 'Unhealthy'];
  trainOptions: string[] = ['All'];
  helptext = helptext;
  selectedStatus: string = this.statusOptions[0];
  selectedTrain: string = this.trainOptions[0];
  filteredItems: any[] = [];
  catalogItems: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<ManageCatalogSummaryDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    protected localeService: LocaleService,
    private loader: AppLoaderService,
    private appService: ApplicationsService,
  ) {
    this.catalog = data;
  }

  ngOnInit(): void {
    this.appService.getCatItems(this.catalog.label).pipe(untilDestroyed(this)).subscribe((evt) => {
      this.catalogItems = [];
      this.trainOptions = ['All'];
      Object.keys(evt).forEach((trainKey) => {
        const train = evt[trainKey];
        this.trainOptions.push(trainKey);
        Object.keys(train).forEach((appKey) => {
          const app = train[appKey];
          Object.keys(app.versions).forEach((versionKey) => {
            const version = app.versions[versionKey];
            version['train'] = trainKey;
            version['app'] = appKey;
            this.catalogItems.push(version);
          });
        });
      });

      this.filteredItems = this.catalogItems;
    });
  }

  onOptionChanged(): void {
    this.filteredItems = this.catalogItems.filter((item) => {
      let isSeletectedTrain = false;
      if (this.selectedTrain == this.trainOptions[0]
        || this.selectedTrain == item.train) {
        isSeletectedTrain = true;
      }

      let isSeletectedStatus = false;
      if (this.selectedStatus == this.statusOptions[0]
        || this.selectedStatus == this.statusOptions[1] && item.healthy
        || this.selectedStatus == this.statusOptions[2] && !item.healthy) {
        isSeletectedStatus = true;
      }

      return isSeletectedTrain && isSeletectedStatus;
    });
  }

  versionStatusLabel(item: any): string {
    let label = '';
    if (this.selectedStatus == this.statusOptions[0]) {
      if (item.healthy) {
        label += '(Healthy)';
      } else {
        label += '(Unhealthy)';
      }
    }

    return label;
  }
}
