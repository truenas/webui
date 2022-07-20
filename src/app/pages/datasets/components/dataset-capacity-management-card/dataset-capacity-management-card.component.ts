import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef, Input, OnChanges, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subscription, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { DatasetQuotaType } from 'app/enums/dataset.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import {
  DatasetCapacitySettingsComponent,
} from 'app/pages/datasets/components/dataset-capacity-management-card/dataset-capacity-settings/dataset-capacity-settings.component';
import { DatasetInTree } from 'app/pages/datasets/store/dataset-in-tree.interface';
import { WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-dataset-capacity-management-card',
  templateUrl: './dataset-capacity-management-card.component.html',
  styleUrls: ['./dataset-capacity-management-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetCapacityManagementCardComponent implements OnInit, OnChanges {
  @Input() dataset: DatasetInTree;

  extraProperties: Dataset;
  extraPropertiesSubscription: Subscription;
  isLoadingQuotas = false;
  isLoadingProperties = false;
  quotasSubscription: Subscription;
  userQuotas: number;
  groupQuotas: number;

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private slideInService: IxSlideInService,
  ) {}

  ngOnInit(): void {
    this.slideInService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      this.loadExtraProperties();
    });
  }

  ngOnChanges(): void {
    this.loadExtraProperties();
    if (!this.dataset.locked) {
      this.getQuotas();
    }
  }

  loadExtraProperties(): void {
    this.isLoadingProperties = true;
    this.cdr.markForCheck();
    this.extraPropertiesSubscription?.unsubscribe();
    // TODO: Consider limiting to only the properties we need.
    this.extraPropertiesSubscription = this.ws.call('pool.dataset.query', [[['id', '=', this.dataset.id]]]).pipe(
      map((datasets) => datasets[0]),
      untilDestroyed(this),
    ).subscribe((dataset) => {
      this.extraProperties = dataset;
      this.isLoadingProperties = false;
      this.cdr.markForCheck();
    });
  }

  getQuotas(): void {
    this.isLoadingQuotas = true;
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
      this.isLoadingQuotas = false;
      this.cdr.markForCheck();
      // TODO: Handle error.
    });
  }

  editDataset(): void {
    const editDatasetComponent = this.slideInService.open(DatasetCapacitySettingsComponent, { wide: true });
    editDatasetComponent.setDatasetForEdit(this.extraProperties);
  }
}
