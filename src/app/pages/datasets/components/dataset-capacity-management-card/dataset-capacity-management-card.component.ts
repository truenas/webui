import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef, Input, OnChanges, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { maxBy } from 'lodash';
import { forkJoin, Subject } from 'rxjs';
import {
  map, take, switchMap, tap,
} from 'rxjs/operators';
import { DatasetType, DatasetQuotaType } from 'app/enums/dataset.enum';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { DatasetCapacitySettingsComponent } from 'app/pages/datasets/components/dataset-capacity-management-card/dataset-capacity-settings/dataset-capacity-settings.component';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-dataset-capacity-management-card',
  templateUrl: './dataset-capacity-management-card.component.html',
  styleUrls: ['./dataset-capacity-management-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetCapacityManagementCardComponent implements OnChanges, OnInit {
  @Input() dataset: DatasetDetails;

  refreshQuotas$ = new Subject<void>();
  inheritedQuotasDataset: DatasetDetails;
  isLoadingQuotas = false;
  userQuotas: number;
  groupQuotas: number;

  get isFilesystem(): boolean {
    return this.dataset.type === DatasetType.Filesystem;
  }

  get isZvol(): boolean {
    return this.dataset.type === DatasetType.Volume;
  }

  get checkQuotas(): boolean {
    return !this.dataset.locked && this.isFilesystem && !this.dataset.readonly;
  }

  get hasQuota(): boolean {
    return Boolean(this.dataset?.quota?.parsed);
  }

  get hasRefQuota(): boolean {
    return Boolean(this.dataset?.refquota?.parsed);
  }

  get hasInheritedQuotas(): boolean {
    return this.inheritedQuotasDataset?.quota?.parsed && this.inheritedQuotasDataset?.id !== this.dataset?.id;
  }

  constructor(
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private datasetStore: DatasetTreeStore,
    private slideInService: IxSlideInService,
    private dialogService: DialogService,
  ) {}

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    this.getInheritedQuotas();
    const selectedDatasetHasChanged = changes?.dataset?.previousValue?.id !== changes?.dataset?.currentValue?.id;
    if (selectedDatasetHasChanged && this.checkQuotas) {
      this.refreshQuotas$.next();
    }
  }

  ngOnInit(): void {
    if (this.checkQuotas) {
      this.initQuotas();
      this.refreshQuotas$.next();
    }
  }

  initQuotas(): void {
    this.refreshQuotas$.pipe(
      tap(() => {
        this.isLoadingQuotas = true;
        this.cdr.markForCheck();
      }),
      switchMap(() => forkJoin([
        this.ws.call('pool.dataset.get_quota', [this.dataset.id, DatasetQuotaType.User, []]),
        this.ws.call('pool.dataset.get_quota', [this.dataset.id, DatasetQuotaType.Group, []]),
      ])),
      untilDestroyed(this),
    ).subscribe({
      next: ([userQuotas, groupQuotas]) => {
        this.userQuotas = userQuotas.length;
        this.groupQuotas = groupQuotas.length;
        this.isLoadingQuotas = false;
        this.cdr.markForCheck();
      },
      error: (error: WebsocketError) => {
        this.isLoadingQuotas = false;
        this.dialogService.error(this.errorHandler.parseWsError(error));
        this.cdr.markForCheck();
      },
    });
  }

  getInheritedQuotas(): void {
    this.datasetStore.selectedBranch$.pipe(
      map((datasets) => {
        const datasetWithQuotas = datasets.filter((dataset) => Boolean(dataset?.quota?.parsed));
        return maxBy(datasetWithQuotas, (dataset) => dataset.quota.parsed);
      }),
      take(1),
      untilDestroyed(this),
    ).subscribe({
      next: (dataset) => {
        this.inheritedQuotasDataset = dataset;
        this.cdr.markForCheck();
      },
      error: (error: WebsocketError) => {
        this.dialogService.error(this.errorHandler.parseWsError(error));
      },
    });
  }

  editDataset(): void {
    this.slideInService
      .open(DatasetCapacitySettingsComponent, { wide: true, data: this.dataset })
      .slideInClosed$
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.datasetStore.datasetUpdated();
      });
  }
}
