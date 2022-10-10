import {
  OnInit, Component, ViewEncapsulation, Inject,
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { JobState } from 'app/enums/job-state.enum';
import helptext from 'app/helptext/apps/apps';
import { Catalog, CatalogItems } from 'app/interfaces/catalog.interface';
import { Job } from 'app/interfaces/job.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/modules/entity/utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { DialogService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-manage-catalog-summary-dialog',
  styleUrls: ['./manage-catalog-summary-dialog.component.scss'],
  templateUrl: './manage-catalog-summary-dialog.component.html',
  // eslint-disable-next-line @angular-eslint/use-component-view-encapsulation
  encapsulation: ViewEncapsulation.None,
})
export class ManageCatalogSummaryDialogComponent implements OnInit {
  catalog: Catalog;
  statusOptions: string[] = ['All', 'Healthy', 'Unhealthy'];
  trainOptions: string[] = ['All'];
  helptext = helptext;
  selectedStatus: string = this.statusOptions[0];
  selectedTrain: string = this.trainOptions[0];
  filteredItems: { train: string; app: string; healthy: boolean }[] = [];
  catalogItems: { train: string; app: string; healthy: boolean }[] = [];

  constructor(
    public dialogRef: MatDialogRef<EntityJobComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Catalog,
    private ws: WebSocketService,
    private loader: AppLoaderService,
    protected dialogService: DialogService,
  ) {
    this.catalog = data;
  }

  ngOnInit(): void {
    this.loader.open();
    this.ws.job('catalog.items', [this.catalog.label]).pipe(untilDestroyed(this)).subscribe({
      next: (job: Job<CatalogItems>) => {
        if (job.state !== JobState.Success) {
          return;
        }

        this.loader.close();
        const result = job.result;
        this.catalogItems = [];
        this.trainOptions = ['All'];
        if (result) {
          Object.keys(result).forEach((trainKey) => {
            const train = result[trainKey];
            this.trainOptions.push(trainKey);
            Object.keys(train).forEach((appKey) => {
              const app = train[appKey];
              this.catalogItems.push({
                train: trainKey,
                app: appKey,
                healthy: app.healthy,
              });
            });
          });
          this.filteredItems = this.catalogItems;
        }
      },
      error: (err) => {
        this.loader.close();
        new EntityUtils().handleWsError(this, err, this.dialogService);
      },
    });
  }

  onOptionChanged(): void {
    this.filteredItems = this.catalogItems.filter((item) => {
      let isSeletectedTrain = false;
      if (this.selectedTrain === this.trainOptions[0]
        || this.selectedTrain === item.train) {
        isSeletectedTrain = true;
      }

      let isSeletectedStatus = false;
      if (this.selectedStatus === this.statusOptions[0]
        || (this.selectedStatus === this.statusOptions[1] && item.healthy)
        || (this.selectedStatus === this.statusOptions[2] && !item.healthy)) {
        isSeletectedStatus = true;
      }

      return isSeletectedTrain && isSeletectedStatus;
    });
  }
}
