import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, first, switchMap } from 'rxjs/operators';
import { DatasetType } from 'app/enums/dataset.enum';
import { OnOff } from 'app/enums/on-off.enum';
import { ZfsPropertySource } from 'app/enums/zfs-property-source.enum';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DatasetFormComponent } from 'app/pages/datasets/components/dataset-form/dataset-form.component';
import { DeleteDatasetDialogComponent } from 'app/pages/datasets/components/delete-dataset-dialog/delete-dataset-dialog.component';
import { ZvolFormComponent } from 'app/pages/datasets/components/zvol-form/zvol-form.component';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-dataset-details-card',
  templateUrl: './dataset-details-card.component.html',
  styleUrls: ['./dataset-details-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetDetailsCardComponent {
  @Input() dataset: DatasetDetails;
  @Input() isLoading: boolean;

  readonly OnOff = OnOff;

  constructor(
    private translate: TranslateService,
    private mdDialog: MatDialog,
    private datasetStore: DatasetTreeStore,
    private slideInService: IxSlideInService,
    private errorHandler: ErrorHandlerService,
    private router: Router,
    private ws: WebSocketService,
    private dialogService: DialogService,
    private snackbar: SnackbarService,
  ) { }

  get datasetCompression(): string {
    return this.dataset?.compression?.source === ZfsPropertySource.Inherited
      ? 'Inherit (' + this.dataset.compression?.value + ')'
      : this.dataset.compression?.value;
  }

  get datasetSpace(): string {
    return (this.dataset.quota.value !== null || this.dataset.quota.value !== '0')
    || (this.dataset.refquota.value !== null || this.dataset.refquota.value !== '0')
      ? this.dataset.available.value + ' (Quota set)' : this.dataset.available.value;
  }

  get isFilesystem(): boolean {
    return this.dataset.type === DatasetType.Filesystem;
  }

  get isZvol(): boolean {
    return this.dataset.type === DatasetType.Volume;
  }

  get hasComments(): boolean {
    return this.dataset.comments?.source === ZfsPropertySource.Local && !!this.dataset.comments?.value?.length;
  }

  get canBePromoted(): boolean {
    return Boolean(this.dataset.origin?.parsed);
  }

  deleteDataset(): void {
    this.mdDialog.open(DeleteDatasetDialogComponent, { data: this.dataset })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => {
          this.datasetStore.datasetUpdated();
          return this.datasetStore.selectedParentDataset$.pipe(first());
        }),
        untilDestroyed(this),
      )
      .subscribe((parent) => {
        this.router.navigate(['/datasets', parent?.id], { state: { hideMobileDetails: true } });
      });
  }

  promoteDataset(): void {
    this.ws.call('pool.dataset.promote', [this.dataset.id])
      .pipe(this.errorHandler.catchError(), untilDestroyed(this))
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Dataset promoted successfully.'));
        this.datasetStore.datasetUpdated();
      });
  }

  editDataset(): void {
    const slideInRef = this.slideInService.open(DatasetFormComponent, {
      wide: true, data: { datasetId: this.dataset.id, isNew: false },
    });
    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => this.datasetStore.datasetUpdated());
  }

  editZvol(): void {
    const slideInRef = this.slideInService.open(ZvolFormComponent, {
      data: { isNew: false, parentId: this.dataset.id },
    });
    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => this.datasetStore.datasetUpdated());
  }
}
