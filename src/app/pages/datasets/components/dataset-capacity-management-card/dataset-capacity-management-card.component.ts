import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef, Input, OnChanges,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { maxBy } from 'lodash';
import { Subscription, forkJoin } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { DatasetQuotaType, DatasetType } from 'app/enums/dataset.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { DatasetFormComponent } from 'app/pages/datasets/components/dataset-form/dataset-form.component';
import { DatasetInTree } from 'app/pages/datasets/store/dataset-in-tree.interface';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
import { WebSocketService, ModalService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-dataset-capacity-management-card',
  templateUrl: './dataset-capacity-management-card.component.html',
  styleUrls: ['./dataset-capacity-management-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetCapacityManagementCardComponent implements OnChanges {
  @Input() dataset: DatasetInTree;

  inheritedQuotasDataset: DatasetInTree;
  extraProperties: Dataset;
  extraPropertiesSubscription: Subscription;
  isLoading = false;
  quotasSubscription: Subscription;
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
    return Boolean(this.extraProperties.quota.parsed);
  }

  get hasInheritedQuotas(): boolean {
    return this.inheritedQuotasDataset?.quota?.parsed && this.inheritedQuotasDataset?.id !== this.dataset?.id;
  }

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private modalService: ModalService,
    private translate: TranslateService,
    private datasetStore: DatasetTreeStore,
  ) {}

  ngOnChanges(): void {
    this.loadExtraProperties();
    this.getInheritedQuotas();
    if (this.checkQuotas) {
      this.getQuotas();
    }
  }

  loadExtraProperties(): void {
    this.isLoading = true;
    this.extraPropertiesSubscription?.unsubscribe();
    this.extraPropertiesSubscription = this.ws.call('pool.dataset.query', [[['id', '=', this.dataset.id]]]).pipe(
      map((datasets) => datasets[0]),
      untilDestroyed(this),
    ).subscribe((dataset) => {
      this.extraProperties = dataset;
      this.isLoading = false;
      this.cdr.markForCheck();
    });
  }

  getQuotas(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.quotasSubscription?.unsubscribe();
    this.quotasSubscription = forkJoin([
      this.ws.call('pool.dataset.get_quota', [this.dataset.id, DatasetQuotaType.User, []]),
      this.ws.call('pool.dataset.get_quota', [this.dataset.id, DatasetQuotaType.Group, []]),
    ]).pipe(
      untilDestroyed(this),
    ).subscribe(([userQuotas, groupQuotas]) => {
      this.userQuotas = userQuotas.length;
      this.groupQuotas = groupQuotas.length;
      this.isLoading = false;
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
    const editDatasetComponent = this.modalService.openInSlideIn(DatasetFormComponent, this.dataset.id);
    editDatasetComponent.setPk(this.dataset.id);
    editDatasetComponent.setVolId(this.dataset.pool);
    editDatasetComponent.setTitle(this.translate.instant('Edit Dataset'));
  }
}
