import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef, Input, OnChanges,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Subscription, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { DatasetQuotaType, DatasetType } from 'app/enums/dataset.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { DatasetFormComponent } from 'app/pages/datasets/components/dataset-form/dataset-form.component';
import { DatasetInTree } from 'app/pages/datasets/store/dataset-in-tree.interface';
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

  extraProperties: Dataset;
  extraPropertiesSubscription: Subscription;
  isLoading = false;
  quotasSubscription: Subscription;
  userQuotas: number;
  groupQuotas: number;
  inheritedQuotas = 0;
  appliedQuotas = 0;

  get isFilesystem(): boolean {
    return this.dataset.type === DatasetType.Filesystem;
  }

  get isZvol(): boolean {
    return this.dataset.type === DatasetType.Volume;
  }

  get checkQuotas(): boolean {
    return !this.dataset.locked && this.isFilesystem;
  }

  get nameSegments(): string[] {
    return this.dataset.name.split('/');
  }

  get datasetLabel(): string {
    return this.nameSegments[this.nameSegments.length - 1];
  }

  get hasQuota(): boolean {
    return this.extraProperties.quota.value !== null || this.extraProperties.quota.value !== '0';
  }

  get hasRefQuota(): boolean {
    return this.extraProperties.refquota.value !== null || this.extraProperties.refquota.value !== '0';
  }

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private modalService: ModalService,
    private translate: TranslateService,
  ) {}

  ngOnChanges(): void {
    this.loadExtraProperties();
    if (this.checkQuotas) {
      this.getQuotas();
    }
  }

  loadExtraProperties(): void {
    this.cdr.markForCheck();
    this.extraPropertiesSubscription?.unsubscribe();
    this.extraPropertiesSubscription = this.ws.call('pool.dataset.query', [[['id', '=', this.dataset.id]]]).pipe(
      map((datasets) => datasets[0]),
      untilDestroyed(this),
    ).subscribe((dataset) => {
      this.extraProperties = dataset;
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
      this.ws.call('pool.dataset.get_quota', [this.dataset.id, DatasetQuotaType.Dataset, []]),
    ]).pipe(
      untilDestroyed(this),
    ).subscribe(([userQuotas, groupQuotas, datasetQuotas]) => {
      this.userQuotas = userQuotas.length;
      this.groupQuotas = groupQuotas.length;
      // TODO: Show real values
      this.appliedQuotas = datasetQuotas.length ? datasetQuotas[0].used_bytes : 0;
      this.isLoading = false;
      this.cdr.markForCheck();
      // TODO: Handle error.
    });
  }

  editDataset(): void {
    const editDatasetComponent = this.modalService.openInSlideIn(DatasetFormComponent, this.dataset.id);
    editDatasetComponent.setPk(this.dataset.id);
    editDatasetComponent.setVolId(this.dataset.pool);
    editDatasetComponent.setTitle(this.translate.instant('Edit Dataset'));
  }
}
