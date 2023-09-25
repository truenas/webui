import {
  ChangeDetectionStrategy, Component, Inject,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import helptext from 'app/helptext/storage/volumes/volume-list';
import { Dataset } from 'app/interfaces/dataset.interface';
import { Job } from 'app/interfaces/job.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@UntilDestroy()
@Component({
  templateUrl: './lock-dataset-dialog.component.html',
  styleUrls: ['./lock-dataset-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LockDatasetDialogComponent {
  forceCheckbox = new FormControl(false);

  constructor(
    private matDialog: MatDialog,
    private errorHandler: ErrorHandlerService,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    private dialogRef: MatDialogRef<LockDatasetDialogComponent>,
    private dialogService: DialogService,
    @Inject(MAT_DIALOG_DATA) public dataset: Dataset,
  ) { }

  onSubmit($event: SubmitEvent): void {
    $event.preventDefault();

    const force = this.forceCheckbox.value;
    const jobDialogRef = this.matDialog.open(EntityJobComponent, {
      data: { title: helptext.lock_dataset_dialog.locking_dataset },
      disableClose: true,
    });
    jobDialogRef.componentInstance.setDescription(
      this.translate.instant('Locking dataset {datasetName}', { datasetName: this.dataset.name }),
    );
    jobDialogRef.componentInstance.setCall('pool.dataset.lock', [this.dataset.id, { force_umount: force }]);
    jobDialogRef.componentInstance.submit();
    jobDialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe({
      next: () => {
        jobDialogRef.close();
        this.snackbar.success(this.translate.instant('Dataset locked'));
        this.dialogRef.close(true);
      },
      error: (error: WebsocketError | Job) => {
        this.dialogService.error(this.errorHandler.parseError(error));
      },
    });
    jobDialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe({
      next: (job) => {
        jobDialogRef.close();
        this.dialogRef.close(true);
        this.dialogService.error(this.errorHandler.parseJobError(job));
      },
      error: (error: WebsocketError | Job) => {
        this.dialogService.error(this.errorHandler.parseError(error));
      },
    });
  }
}
