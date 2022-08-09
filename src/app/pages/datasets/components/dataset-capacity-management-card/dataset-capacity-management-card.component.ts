import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef, Input, OnChanges, SimpleChanges, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { maxBy } from 'lodash';
import { forkJoin, Subject, EMPTY } from 'rxjs';
import {
  map, take, switchMap, tap, catchError,
} from 'rxjs/operators';
import { DatasetType, DatasetQuotaType } from 'app/enums/dataset.enum';
import { Dataset, DatasetDetails } from 'app/interfaces/dataset.interface';
import { DatasetCapacitySettingsComponent } from 'app/pages/datasets/components/dataset-capacity-management-card/dataset-capacity-settings/dataset-capacity-settings.component';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
import { WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-dataset-capacity-management-card',
  templateUrl: './dataset-capacity-management-card.component.html',
  styleUrls: ['./dataset-capacity-management-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetCapacityManagementCardComponent implements OnChanges, OnInit {
  @Input() dataset: DatasetDetails;
  @Input() datasetFull: Dataset;
  @Input() isLoading: boolean;

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
    return !this.dataset.locked && this.isFilesystem;
  }

  get hasQuota(): boolean {
    return Boolean(this.dataset?.quota?.parsed);
  }

  get hasInheritedQuotas(): boolean {
    return this.inheritedQuotasDataset?.quota?.parsed && this.inheritedQuotasDataset?.id !== this.dataset?.id;
  }

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private datasetStore: DatasetTreeStore,
    private slideInService: IxSlideInService,
  ) {}

  ngOnInit(): void {
    if (this.checkQuotas) {
      this.initQuotas();
      this.refreshQuotas$.next();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.getInheritedQuotas();
    const selectedDatasetHasChanged = changes?.dataset?.previousValue?.id !== changes?.dataset?.currentValue?.id;
    if (selectedDatasetHasChanged && this.checkQuotas) {
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
      catchError(() => EMPTY),
      untilDestroyed(this),
    ).subscribe(([userQuotas, groupQuotas]) => {
      this.userQuotas = userQuotas.length;
      this.groupQuotas = groupQuotas.length;
      this.isLoadingQuotas = false;
      this.cdr.markForCheck();
      // TODO: Handle error.
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
    ).subscribe((dataset) => {
      this.inheritedQuotasDataset = dataset;
      this.cdr.markForCheck();
    });
  }

  editDataset(): void {
    const editDatasetComponent = this.slideInService.open(DatasetCapacitySettingsComponent, { wide: true });
    editDatasetComponent.setDatasetForEdit(this.datasetFull);
  }
}
