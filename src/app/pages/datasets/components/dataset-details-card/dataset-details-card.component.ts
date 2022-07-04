import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { ZfsPropertySource } from 'app/enums/zfs-property-source.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { DatasetFormComponent } from 'app/pages/datasets/components/dataset-form/dataset-form.component';
import { DeleteDatasetDialogComponent } from 'app/pages/datasets/components/delete-dataset-dialog/delete-dataset-dialog.component';
import { DatasetStore } from 'app/pages/datasets/store/dataset-store.service';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  selector: 'ix-dataset-details-card',
  templateUrl: './dataset-details-card.component.html',
  styleUrls: ['./dataset-details-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetDetailsCardComponent {
  @Input() dataset: Dataset;

  constructor(
    private modalService: ModalService,
    private translate: TranslateService,
    private mdDialog: MatDialog,
    private datasetStore: DatasetStore,
  ) { }

  get datasetCompression(): string {
    return this.dataset.compression?.source === ZfsPropertySource.Inherited
      ? 'Inherit (' + this.dataset.compression?.value + ')'
      : this.dataset.compression?.value;
  }

  get datasetSpace(): string {
    return (this.dataset.quota.value !== null || this.dataset.quota.value !== '0')
    || (this.dataset.refquota.value !== null || this.dataset.refquota.value !== '0')
      ? this.dataset.available.value + ' (Quota set)' : this.dataset.available.value;
  }

  deleteDataset(): void {
    this.mdDialog.open(DeleteDatasetDialogComponent, { data: this.dataset })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((shouldRefresh) => {
        if (shouldRefresh) {
          this.datasetStore.reloadList();
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
