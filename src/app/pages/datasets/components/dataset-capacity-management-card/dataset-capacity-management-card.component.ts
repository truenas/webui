import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef, Input, OnChanges,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Subscription, forkJoin } from 'rxjs';
import { DatasetQuotaType } from 'app/enums/dataset.enum';
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
  ) {}

  ngOnChanges(): void {
    if (!this.dataset.encrypted) {
      this.getQuotas();
    }
  }

  getQuotas(): void {
    this.loading = true;
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
      this.loading = false;
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
