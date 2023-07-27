import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import {
  FormBuilder, FormControl, FormGroup, Validators,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  Observable,
  from, of, switchMap, tap,
} from 'rxjs';
import { DatasetEncryptionType } from 'app/enums/dataset.enum';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-unlock';
import { DatasetEncryptionSummary, DatasetEncryptionSummaryQueryParams, DatasetEncryptionSummaryQueryParamsDataset } from 'app/interfaces/dataset-encryption-summary.interface';
import { DatasetUnlockParams, DatasetUnlockResult } from 'app/interfaces/dataset-lock.interface';
import { Job } from 'app/interfaces/job.interface';
import { RadioOption } from 'app/interfaces/option.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { UnlockSummaryDialogComponent } from 'app/pages/datasets/modules/encryption/components/unlock-summary-dialog/unlock-summary-dialog.component';
import { AuthService } from 'app/services/auth/auth.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';

interface DatasetFormGroup {
  key?: FormControl<string>;
  passphrase?: FormControl<string>;
  name: FormControl<string>;
  is_passphrase: FormControl<boolean>;
  file?: FormControl<File[]>;
}

@UntilDestroy()
@Component({
  templateUrl: './dataset-unlock.component.html',
  styleUrls: ['./dataset-unlock.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetUnlockComponent implements OnInit {
  pk: string;
  dialogOpen = false;
  isFormLoading = false;
  hideFileInput = false;

  form = this.formBuilder.group({
    use_file: [true],
    unlock_children: [true],
    file: [null as File[], [Validators.required]],
    key: [''],
    datasets: this.formBuilder.array<FormGroup<DatasetFormGroup>>([]),
    force: [false],
  });

  useFileOptions$: Observable<RadioOption[]> = of([{
    value: true,
    label: this.translate.instant('From a key file'),
  }, {
    value: false,
    label: this.translate.instant('Provide keys/passphrases manually'),
  }]);

  readonly helptext = helptext;

  get useFile(): boolean {
    return this.form.controls.use_file.value;
  }

  private apiEndPoint: string;

  constructor(
    private formBuilder: FormBuilder,
    protected aroute: ActivatedRoute,
    private authService: AuthService,
    protected dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
    private dialog: MatDialog,
    private router: Router,
    private translate: TranslateService,
  ) {
    this.authService.authToken$.pipe(
      tap((token) => {
        this.apiEndPoint = '/_upload?auth_token=' + token;
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  ngOnInit(): void {
    this.pk = this.aroute.snapshot.params['datasetId'] as string;
    this.getEncryptionSummary();

    this.form.controls.use_file.valueChanges.pipe(untilDestroyed(this)).subscribe((useFile) => {
      if (useFile) {
        this.form.controls.file.enable();
        this.form.controls.datasets.disable();
      } else {
        this.form.controls.file.disable();
        this.form.controls.datasets.enable();
      }
    });

    this.form.controls.file.valueChanges.pipe(
      switchMap((files: File[]) => (!files?.length ? of('') : from(files[0].text()))),
      untilDestroyed(this),
    ).subscribe((key) => {
      this.form.controls.key.setValue(key);
    });
  }

  getEncryptionSummary(): void {
    const dialogRef = this.dialog.open(EntityJobComponent, {
      data: { title: helptext.fetching_encryption_summary_title },
      disableClose: true,
    });
    dialogRef.componentInstance.setDescription(
      this.translate.instant(helptext.fetching_encryption_summary_message) + this.pk,
    );
    dialogRef.componentInstance.setCall('pool.dataset.encryption_summary', [this.pk]);
    dialogRef.componentInstance.submit();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe({
      next: (job: Job<DatasetEncryptionSummary[]>) => {
        if (!job) {
          return;
        }

        dialogRef.close();
        if (job.result && job.result.length > 0) {
          for (let i = 0; i < job.result.length; i++) {
            const result = job.result[i];
            const isPassphrase = result.key_format === DatasetEncryptionType.Passphrase;
            if (this.form.controls.datasets.controls[i] === undefined) {
              if (isPassphrase) {
                this.form.controls.datasets.push(this.formBuilder.group({
                  name: [''],
                  passphrase: ['', [Validators.minLength(8)]],
                  is_passphrase: [true],
                }) as FormGroup<DatasetFormGroup>);
              } else {
                this.form.controls.datasets.push(this.formBuilder.group({
                  name: [''],
                  key: ['', [Validators.minLength(64), Validators.maxLength(64)]],
                  file: [null as File[]],
                  is_passphrase: [false],
                }) as FormGroup<DatasetFormGroup>);
              }

              (this.form.controls.datasets.controls[i].controls.file as FormControl)?.valueChanges.pipe(
                switchMap((files: File[]) => (!files?.length ? of('') : from(files[0].text()))),
                untilDestroyed(this),
              ).subscribe((key) => {
                (this.form.controls.datasets.controls[i].controls.key as FormControl).setValue(key);
              });
            }
            this.form.controls.datasets.disable();
            (this.form.controls.datasets.controls[i].controls.name as FormControl).setValue(result.name);
            (this.form.controls.datasets.controls[i].controls.is_passphrase as FormControl).setValue(isPassphrase);
          }
          this.hideFileInput = this.form.controls.datasets.value.every(
            (dataset) => dataset.is_passphrase,
          );
          this.form.controls.use_file.setValue(!this.hideFileInput);
        }
      },
      error: this.handleError,
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe({
      next: (error) => {
        if (error) {
          dialogRef.close();
          this.handleError(error);
        }
      },
      error: this.handleError,
    });
  }

  handleError = (error: WebsocketError | Job): void => {
    this.dialogService.error(this.errorHandler.parseError(error));
  };

  unlockSubmit(payload: DatasetUnlockParams): void {
    const values = this.form.value;
    payload.recursive = !values.use_file || values.unlock_children;
    const dialogRef = this.dialog.open(EntityJobComponent, {
      data: { title: helptext.unlocking_datasets_title },
      disableClose: true,
    });

    if (payload.key_file) {
      const formData: FormData = new FormData();
      formData.append('data', JSON.stringify({
        method: 'pool.dataset.unlock',
        params: [this.pk, payload],
      }));
      formData.append('file', values.key);
      dialogRef.componentInstance.wspost(this.apiEndPoint, formData);
    } else {
      dialogRef.componentInstance.setCall('pool.dataset.unlock', [this.pk, payload]);
      dialogRef.componentInstance.submit();
    }

    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe({
      next: (job: Job<DatasetUnlockResult>) => {
        dialogRef.close();
        this.openUnlockDialog(payload, job);
      },
      error: this.handleError,
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe({
      next: (failedJob) => {
        this.dialogService.error(this.errorHandler.parseJobError(failedJob));
        dialogRef.close();
      },
      error: this.handleError,
    });
  }

  onSave(): void {
    const values = this.form.value;
    const datasets: DatasetEncryptionSummaryQueryParamsDataset[] = [];

    if (!values.use_file) {
      values.datasets.forEach((dataset) => {
        if (values.unlock_children || dataset.name === this.pk) {
          if (dataset.is_passphrase && dataset.passphrase) {
            datasets.push({ name: dataset.name, passphrase: dataset.passphrase });
          }
          if (!dataset.is_passphrase && dataset.key) {
            datasets.push({ name: dataset.name, key: dataset.key });
          }
        }
      });
    }

    const payload: DatasetEncryptionSummaryQueryParams = {
      key_file: values.use_file,
      force: values.force,
      datasets: !values.use_file ? datasets : undefined,
    };

    const dialogRef = this.dialog.open(EntityJobComponent, {
      data: { title: helptext.fetching_encryption_summary_title },
      disableClose: true,
    });
    dialogRef.componentInstance.setDescription(
      this.translate.instant(helptext.fetching_encryption_summary_message) + this.pk,
    );

    if (values.use_file) {
      const formData: FormData = new FormData();
      formData.append('data', JSON.stringify({
        method: 'pool.dataset.encryption_summary',
        params: [this.pk, payload],
      }));
      formData.append('file', values.key);
      dialogRef.componentInstance.wspost(this.apiEndPoint, formData);
    } else {
      dialogRef.componentInstance.setCall('pool.dataset.encryption_summary', [this.pk, payload]);
      dialogRef.componentInstance.submit();
    }

    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe({
      next: (job: Job<DatasetEncryptionSummary[]>) => {
        dialogRef.close();
        this.openSummaryDialog(payload as DatasetUnlockParams, job);
      },
      error: this.handleError,
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe({
      next: (failedJob) => {
        this.dialogService.error(this.errorHandler.parseJobError(failedJob));
        dialogRef.close();
      },
      error: this.handleError,
    });
  }

  openUnlockDialog(payload: DatasetUnlockParams, job: Job<DatasetUnlockResult>): void {
    const errors: { name: string; unlock_error: string }[] = [];
    let skipped: { name: string }[] = [];
    const unlock: { name: string }[] = [];
    if (job?.result) {
      if (job.result.failed) {
        const failed = job.result.failed;
        Object.entries(failed).forEach(([errorDataset, fail]) => {
          const error = fail.error;
          const skip = fail.skipped;
          errors.push({ name: errorDataset, unlock_error: error });
          skipped = skip.map((dataset) => ({ name: dataset }));
        });
      }
      job.result.unlocked.forEach((name) => {
        unlock.push({ name });
      });
      if (!this.dialogOpen) {
        this.dialogOpen = true;
        const unlockDialogRef = this.dialog.open(UnlockSummaryDialogComponent, { disableClose: true });
        unlockDialogRef.componentInstance.parent = this;
        unlockDialogRef.componentInstance.showFinalResults();
        unlockDialogRef.componentInstance.unlockDatasets = unlock;
        unlockDialogRef.componentInstance.errorDatasets = errors;
        unlockDialogRef.componentInstance.skippedDatasets = skipped;
        unlockDialogRef.componentInstance.data = payload;
      }
    }
  }

  openSummaryDialog(payload: DatasetUnlockParams, job: Job<DatasetEncryptionSummary[]>): void {
    const errors: DatasetEncryptionSummary[] = [];
    const unlock: DatasetEncryptionSummary[] = [];
    if (job?.result) {
      job.result.forEach((result) => {
        if (result.unlock_successful) {
          unlock.push(result);
        } else {
          errors.push(result);
        }
      });
    }
    if (!this.dialogOpen) { // prevent dialog from opening more than once
      this.dialogOpen = true;
      const unlockDialogRef = this.dialog.open(UnlockSummaryDialogComponent, { disableClose: true });
      unlockDialogRef.componentInstance.parent = this;
      unlockDialogRef.componentInstance.unlockDatasets = unlock;
      unlockDialogRef.componentInstance.errorDatasets = errors;
      unlockDialogRef.componentInstance.data = payload;
    }
  }

  goBack(): void {
    this.router.navigate(['datasets']);
  }
}
