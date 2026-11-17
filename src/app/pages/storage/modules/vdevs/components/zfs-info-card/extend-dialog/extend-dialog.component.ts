import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal, viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Validators, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnDialogShellComponent, TnTestIdDirective } from '@truenas/ui-components';
import { map, Observable, of } from 'rxjs';
import { finalize, switchMap, tap } from 'rxjs/operators';
import { helptextVolumeStatus } from 'app/helptext/storage/volumes/volume-status';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { PoolAttachParams } from 'app/interfaces/pool.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { UnusedDiskSelectComponent } from 'app/modules/forms/custom-selects/unused-disk-select/unused-disk-select.component';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { SedDiskPasswordComponent } from 'app/pages/storage/modules/vdevs/components/sed-disk-password/sed-disk-password.component';
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
    SedDiskPasswordComponent,
    FormActionsComponent,
    TnButtonComponent,
    TnTestIdDirective,
    TranslateModule,
  ],
})
export class ExtendDialog {
  private formBuilder = inject(FormBuilder);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private dialogService = inject(DialogService);
  private snackbar = inject(SnackbarService);
  private loader = inject(LoaderService);
  private translate = inject(TranslateService);
  protected dialogRef = inject<DialogRef<unknown, ExtendDialog>>(DialogRef);
  private poolExtendJobService = inject(PoolExtendJobService);
  data = inject<ExtendDialogParams>(DIALOG_DATA);
  private destroyRef = inject(DestroyRef);

  form = this.formBuilder.group({
    newDisk: ['', Validators.required],
  });

  protected readonly newDisk = toSignal(
    this.form.controls.newDisk.valueChanges,
    { initialValue: this.form.controls.newDisk.value },
  );

  private readonly sedDiskPassword = viewChild.required(SedDiskPasswordComponent);
  private readonly isFormValid = toSignal(
    this.form.statusChanges.pipe(map(() => this.form.valid)),
    { initialValue: this.form.valid },
  );

  /** Set from the click until the job dialog closes, so a second click can't repeat the SED setup. */
  protected readonly isSubmitting = signal(false);

  protected readonly canSubmit = computed(() => {
    return !this.isSubmitting() && this.isFormValid() && this.sedDiskPassword().isValid();
  });

  /** The disk an individual SED password was already applied to, so a retry skips straight to the job. */
  private preparedDisk: string | null = null;

  readonly helptext = helptextVolumeStatus;

  unusedDisks: DetailsDisk[] = [];

  onSubmit(event?: SubmitEvent): void {
    event?.preventDefault();
    if (this.isSubmitting()) {
      return;
    }
    this.isSubmitting.set(true);

    // `disk.setup_sed` can take several seconds, so the loader covers everything before the job dialog.
    this.poolExtendJobService.checkForExistingExtendJob(this.data.poolId).pipe(
      switchMap((hasExistingJob) => {
        if (hasExistingJob) {
          this.snackbar.error(
            this.translate.instant('A VDEV extension operation is already in progress for this pool. Please wait for it to complete.'),
          );
          return of(false);
        }
        return this.prepareNewDisk().pipe(map(() => true));
      }),
      this.loader.withLoader(),
      switchMap((canAttach) => {
        if (!canAttach) {
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
      finalize(() => this.isSubmitting.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((result) => {
      if (result) {
        this.snackbar.success(this.translate.instant('VDEV successfully extended.'));
        this.dialogRef.close(true);
      }
    });
  }

  /**
   * Applies an individual SED password once per disk. After that the disk is unlocked, and running
   * `disk.setup_sed` again fails because the disk is no longer UNINITIALIZED. With the global
   * password nothing is applied here, so a retry with an individual one must still run it.
   */
  private prepareNewDisk(): Observable<unknown> {
    const disk = this.form.getRawValue().newDisk;
    if (disk === this.preparedDisk) {
      return of(null);
    }
    const sedDiskPassword = this.sedDiskPassword();
    const appliesPassword = sedDiskPassword.appliesPassword();
    return sedDiskPassword.prepareDisk().pipe(
      tap(() => {
        if (appliesPassword) {
          this.preparedDisk = disk;
        }
      }),
    );
  }
}
