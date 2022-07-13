import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { ZfsPropertySource } from 'app/enums/zfs-property-source.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { DatasetFormComponent } from 'app/pages/datasets/components/dataset-form/dataset-form.component';
import { DeleteDatasetDialogComponent } from 'app/pages/datasets/components/delete-dataset-dialog/delete-dataset-dialog.component';
import { DatasetInTree } from 'app/pages/datasets/store/dataset-in-tree.interface';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
import { WebSocketService } from 'app/services';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  selector: 'ix-dataset-details-card',
  templateUrl: './dataset-details-card.component.html',
  styleUrls: ['./dataset-details-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetDetailsCardComponent implements OnChanges {
  @Input() dataset: DatasetInTree;

  isLoading = false;
  extraProperties: Dataset;
  subscription: Subscription;

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private modalService: ModalService,
    private translate: TranslateService,
    private mdDialog: MatDialog,
    private datasetStore: DatasetTreeStore,
  ) { }

  get datasetCompression(): string {
    return this.extraProperties?.compression?.source === ZfsPropertySource.Inherited
      ? 'Inherit (' + this.extraProperties.compression?.value + ')'
      : this.extraProperties.compression?.value;
  }

  get datasetSpace(): string {
    return (this.extraProperties.quota.value !== null || this.extraProperties.quota.value !== '0')
    || (this.extraProperties.refquota.value !== null || this.extraProperties.refquota.value !== '0')
      ? this.extraProperties.available.value + ' (Quota set)' : this.extraProperties.available.value;
  }

  ngOnChanges(): void {
    this.loadExtraProperties();
  }

  loadExtraProperties(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.subscription = this.ws.call('pool.dataset.query', [[['id', '=', this.dataset.id]]]).pipe(untilDestroyed(this)).subscribe(
      (datasets) => {
        this.isLoading = false;
        this.extraProperties = datasets[0];
        this.cdr.markForCheck();
      },
    );
  }

  deleteDataset(): void {
    this.mdDialog.open(DeleteDatasetDialogComponent, { data: this.dataset })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((shouldRefresh) => {
        if (shouldRefresh) {
          this.datasetStore.datasetUpdated();
        }
      });
  }

  editDataset(): void {
    const editDatasetComponent = this.modalService.openInSlideIn(DatasetFormComponent, this.dataset.id);
    editDatasetComponent.setPk(this.dataset.id);
    editDatasetComponent.setVolId(this.dataset.pool);
    editDatasetComponent.setTitle(this.translate.instant('Edit Dataset'));
  }
}
