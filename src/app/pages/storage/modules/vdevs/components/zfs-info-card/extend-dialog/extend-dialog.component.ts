import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogClose,
} from '@angular/material/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { helptextVolumeStatus } from 'app/helptext/storage/volumes/volume-status';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { PoolAttachParams } from 'app/interfaces/pool.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { UnusedDiskSelectComponent } from 'app/modules/forms/custom-selects/unused-disk-select/unused-disk-select.component';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { PoolExtendJobService } from 'app/pages/storage/modules/vdevs/services/pool-extend-job.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

export interface ExtendDialogParams {
  poolId: number;
  targetVdevGuid: string;
}

@UntilDestroy()
@Component({
  selector: 'ix-extend-dialog',
  templateUrl: './extend-dialog.component.html',
  styleUrls: ['./extend-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogTitle,
    ReactiveFormsModule,
    UnusedDiskSelectComponent,
    FormActionsComponent,
    MatButton,
    TestDirective,
    MatDialogClose,
    TranslateModule,
  ],
})
export class ExtendDialog {
  private formBuilder = inject(FormBuilder);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private dialogService = inject(DialogService);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private dialogRef = inject<MatDialogRef<ExtendDialog>>(MatDialogRef);
  private poolExtendJobService = inject(PoolExtendJobService);
  data = inject<ExtendDialogParams>(MAT_DIALOG_DATA);

  form = this.formBuilder.group({
    newDisk: ['', Validators.required],
  });

  readonly helptext = helptextVolumeStatus;

  unusedDisks: DetailsDisk[] = [];

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();

    // Check for existing pool.attach jobs for this pool
    this.poolExtendJobService.checkForExistingExtendJob(this.data.poolId).pipe(
      switchMap((hasExistingJob) => {
        if (hasExistingJob) {
          this.snackbar.success(
            this.translate.instant('A VDEV extension operation is already in progress for this pool. Please wait for it to complete.'),
          );
          return of(null);
        }

        const payload = {
          // UI check for duplicate serials is handled in UnusedDiskSelectComponent
          allow_duplicate_serials: true,
          new_disk: this.form.value.newDisk,
          target_vdev: this.data.targetVdevGuid,
        } as PoolAttachParams;

        return this.dialogService.jobDialog(
          this.api.job('pool.attach', [this.data.poolId, payload]),
          { title: this.translate.instant('Extending VDEV'), canMinimize: true },
        ).afterClosed();
      }),
      this.errorHandler.withErrorHandler(),
      untilDestroyed(this),
    ).subscribe((result) => {
      if (result) {
        this.snackbar.success(this.translate.instant('VDEV successfully extended.'));
        this.dialogRef.close(true);
      }
    });
  }
}
