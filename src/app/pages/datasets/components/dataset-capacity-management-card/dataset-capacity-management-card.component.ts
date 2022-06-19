import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef, Input, OnChanges,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Subscription, forkJoin } from 'rxjs';
import {
  map,
} from 'rxjs/operators';
import { DatasetQuotaType } from 'app/enums/dataset.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { DatasetFormComponent } from 'app/pages/datasets/components/dataset-form/dataset-form.component';
import { WebSocketService, ModalService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-dataset-capacity-management-card',
  templateUrl: './dataset-capacity-management-card.component.html',
  styleUrls: ['./dataset-capacity-management-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetCapacityManagementCardComponent implements OnChanges {
  @Input() dataset: Dataset;
  loading = false;
  datasetSubscription: Subscription;
  quotasSubscription: Subscription;
  userQuotas: number;
  groupQuotas: number;

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private modalService: ModalService,
    private translate: TranslateService,
    private mdDialog: MatDialog,
  ) {}

  ngOnChanges(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.getDataset();
  }

  getDataset(): void {
    this.datasetSubscription?.unsubscribe();
    this.datasetSubscription = this.ws.call('pool.dataset.query', [[['id', '=', this.dataset.id]]]).pipe(
      map((datasets) => datasets[0]),
      untilDestroyed(this),
    ).subscribe(
      (dataset) => {
        this.dataset = dataset;
        if (!dataset.encrypted) {
          this.getQuotas();
        } else {
          this.loading = false;
          this.cdr.markForCheck();
        }
      },
      (error) => {
        console.error(error);
        this.loading = false;
        this.cdr.markForCheck();
      },
    );
  }

  getQuotas(): void {
    this.quotasSubscription?.unsubscribe();
    this.quotasSubscription = forkJoin([
      this.ws.call('pool.dataset.get_quota', [this.dataset.id, DatasetQuotaType.User, []]),
      this.ws.call('pool.dataset.get_quota', [this.dataset.id, DatasetQuotaType.Group, []]),
    ]).pipe(
      untilDestroyed(this),
    ).subscribe(([userQuotas, groupQuotas]) => {
      this.userQuotas = userQuotas.length;
      this.groupQuotas = groupQuotas.length;
      this.loading = false;
      this.cdr.markForCheck();
    });
  }

  editDataset(): void {
    const editDatasetComponent = this.modalService.openInSlideIn(DatasetFormComponent, this.dataset.id);
    editDatasetComponent.setPk(this.dataset.id);
    editDatasetComponent.setVolId(this.dataset.pool);
    editDatasetComponent.setTitle(this.translate.instant('Edit Dataset'));
  }
}
