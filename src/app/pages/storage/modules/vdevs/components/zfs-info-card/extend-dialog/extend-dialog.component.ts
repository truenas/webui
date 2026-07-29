import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Validators, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnDialogShellComponent } from '@truenas/ui-components';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { helptextVolumeStatus } from 'app/helptext/storage/volumes/volume-status';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { PoolAttachParams } from 'app/interfaces/pool.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { UnusedDiskSelectComponent } from 'app/modules/forms/custom-selects/unused-disk-select/unused-disk-select.component';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { PoolExtendJobService } from 'app/pages/storage/modules/vdevs/services/pool-extend-job.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

export interface ExtendDialogParams {
  poolId: number;
  targetVdevGuid: string;
}

@Component({
  selector: 'ix-extend-dialog',
  templateUrl: './extend-dialog.component.html',
  styleUrls: ['./extend-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    ReactiveFormsModule,
    UnusedDiskSelectComponent,
    FormActionsComponent,
    TnButtonComponent,
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
  protected dialogRef = inject<DialogRef<unknown, ExtendDialog>>(DialogRef);
  private poolExtendJobService = inject(PoolExtendJobService);
  data = inject<ExtendDialogParams>(DIALOG_DATA);
  private destroyRef = inject(DestroyRef);

  form = this.formBuilder.group({
    newDisk: ['', Validators.required],
  });

  readonly helptext = helptextVolumeStatus;

  unusedDisks: DetailsDisk[] = [];

  onSubmit(event?: SubmitEvent): void {
    event?.preventDefault();

    // Check for existing pool.attach jobs for this pool
    this.poolExtendJobService.checkForExistingExtendJob(this.data.poolId).pipe(
      switchMap((hasExistingJob) => {
        if (hasExistingJob) {
          this.snackbar.error(
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
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((result) => {
      if (result) {
        this.snackbar.success(this.translate.instant('VDEV successfully extended.'));
        this.dialogRef.close(true);
      }
    });
  }
}
