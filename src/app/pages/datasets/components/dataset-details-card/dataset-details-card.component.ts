import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { DatasetType } from 'app/enums/dataset.enum';
import { ZfsPropertySource } from 'app/enums/zfs-property-source.enum';
import { Dataset, DatasetDetails } from 'app/interfaces/dataset.interface';
import { DatasetFormComponent } from 'app/pages/datasets/components/dataset-form/dataset-form.component';
import { DeleteDatasetDialogComponent } from 'app/pages/datasets/components/delete-dataset-dialog/delete-dataset-dialog.component';
import { ZvolFormComponent } from 'app/pages/datasets/components/zvol-form/zvol-form.component';
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
  @Input() dataset: DatasetDetails;

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

  get isFilesystem(): boolean {
    return this.dataset.type === DatasetType.Filesystem;
  }

  get isZvol(): boolean {
    return this.dataset.type === DatasetType.Volume;
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

  editZvol(): void {
    const addZvolComponent = this.modalService.openInSlideIn(ZvolFormComponent, this.dataset.id);
    addZvolComponent.setParent(this.dataset.id);
    addZvolComponent.isNew = false;
    // form doesnt work without cdr.markForCheck
    this.cdr.markForCheck();
  }
}
