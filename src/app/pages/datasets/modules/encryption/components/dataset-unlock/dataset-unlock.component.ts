import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import {
  FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  Observable,
  from, of, switchMap, tap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { DatasetEncryptionType } from 'app/enums/dataset.enum';
import { Role } from 'app/enums/role.enum';
import { helptextUnlock } from 'app/helptext/storage/volumes/datasets/dataset-unlock';
import { DatasetEncryptionSummary, DatasetEncryptionSummaryQueryParams, DatasetEncryptionSummaryQueryParamsDataset } from 'app/interfaces/dataset-encryption-summary.interface';
import { DatasetUnlockParams, DatasetUnlockResult } from 'app/interfaces/dataset-lock.interface';
import { RadioOption } from 'app/interfaces/option.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFileInputComponent } from 'app/modules/forms/ix-forms/components/ix-file-input/ix-file-input.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxListItemComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list-item/ix-list-item.component';
import { IxListComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.component';
import { IxRadioGroupComponent } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.component';
import { IxTextareaComponent } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { UnlockSummaryDialogComponent } from 'app/pages/datasets/modules/encryption/components/unlock-summary-dialog/unlock-summary-dialog.component';
import { AuthService } from 'app/services/auth/auth.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { UploadService } from 'app/services/upload.service';
import { WebSocketService } from 'app/services/ws.service';

interface DatasetFormGroup {
  key?: FormControl<string>;
  passphrase?: FormControl<string>;
  name: FormControl<string>;
  is_passphrase: FormControl<boolean>;
  file?: FormControl<File[]>;
}

@UntilDestroy()
@Component({
  selector: 'ix-dataset-unlock',
  templateUrl: './dataset-unlock.component.html',
  styleUrls: ['./dataset-unlock.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    MatCardContent,
    IxRadioGroupComponent,
    ReactiveFormsModule,
    IxCheckboxComponent,
    IxFileInputComponent,
    IxListComponent,
    IxListItemComponent,
    TranslateModule,
    IxInputComponent,
    IxTextareaComponent,
    MatButton,
    RequiresRolesDirective,
    TestDirective,
  ],
})
export class DatasetUnlockComponent implements OnInit {
  readonly requiredRoles = [Role.DatasetWrite];

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

  readonly helptext = helptextUnlock;

  get useFile(): boolean {
    return this.form.controls.use_file.value;
  }

  private apiEndPoint: string;

  constructor(
    private ws: WebSocketService,
    private formBuilder: FormBuilder,
    private aroute: ActivatedRoute,
    private authService: AuthService,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
    private matDialog: MatDialog,
    private router: Router,
    private translate: TranslateService,
    private upload: UploadService,
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
    this.dialogService.jobDialog(
      this.ws.job('pool.dataset.encryption_summary', [this.pk]),
      {
        title: this.translate.instant(helptextUnlock.fetching_encryption_summary_title),
        description: this.translate.instant(helptextUnlock.fetching_encryption_summary_message, { dataset: this.pk }),
      },
    )
      .afterClosed()
      .pipe(
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe((job) => {
        this.processSummary(job.result);
      });
  }

  private processSummary(summary: DatasetEncryptionSummary[]): void {
    if (!summary?.length) {
      return;
    }

    summary.forEach((result, i) => {
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
          switchMap((files: File[]) => (!files?.length ? of('{}') : from(files[0].text()))),
          untilDestroyed(this),
        ).subscribe((textFromFile) => {
          const key = (JSON.parse(textFromFile) as Record<string, string>)[result.name];
          if (key) {
            this.form.controls.datasets.controls[i].controls.key.setValue(key);
          }
        });
      }
      this.form.controls.datasets.disable();
      (this.form.controls.datasets.controls[i].controls.name as FormControl).setValue(result.name);
      (this.form.controls.datasets.controls[i].controls.is_passphrase as FormControl).setValue(isPassphrase);
    });
    this.hideFileInput = this.form.controls.datasets.value.every(
      (dataset) => dataset.is_passphrase,
    );
    this.form.controls.use_file.setValue(!this.hideFileInput);
  }

  unlockSubmit(payload: DatasetUnlockParams): void {
    const values = this.form.value;
    payload.recursive = !values.use_file || values.unlock_children;

    const job$ = payload.key_file
      ? this.upload.uploadAsJob({
        file: values.file[0],
        method: 'pool.dataset.unlock',
        params: [this.pk, payload],
      })
      : this.ws.job('pool.dataset.unlock', [this.pk, payload]);

    this.dialogService.jobDialog(job$, {
      title: this.translate.instant(helptextUnlock.unlocking_datasets_title),
    })
      .afterClosed()
      .pipe(
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe((job) => {
        this.openUnlockDialog(payload, job.result);
      });
  }

  onSave(): void {
    const values = this.form.value;
    const datasets: DatasetEncryptionSummaryQueryParamsDataset[] = [];

    if (!values.use_file) {
      values.datasets.forEach((dataset) => {
        if (dataset.is_passphrase && dataset.passphrase) {
          datasets.push({ name: dataset.name, passphrase: dataset.passphrase });
        }
        if (!dataset.is_passphrase && dataset.key) {
          datasets.push({ name: dataset.name, key: dataset.key });
        }
      });
    }

    const payload: DatasetEncryptionSummaryQueryParams = {
      key_file: values.use_file,
      force: values.force,
      datasets: !values.use_file ? datasets : undefined,
    };

    const job$ = values.use_file
      ? this.upload.uploadAsJob({
        file: values.file[0],
        method: 'pool.dataset.encryption_summary',
        params: [this.pk, payload],
      })
      : this.ws.job('pool.dataset.encryption_summary', [this.pk, payload]);

    this.dialogService.jobDialog(job$, {
      title: this.translate.instant(helptextUnlock.fetching_encryption_summary_title),
      description: this.translate.instant(helptextUnlock.fetching_encryption_summary_message, { dataset: this.pk }),
    })
      .afterClosed()
      .pipe(
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe((job) => {
        this.openSummaryDialog(payload as DatasetUnlockParams, job.result);
      });
  }

  openUnlockDialog(payload: DatasetUnlockParams, unlockResult: DatasetUnlockResult): void {
    const errors: { name: string; unlock_error: string }[] = [];
    let skipped: { name: string }[] = [];
    const unlock: { name: string }[] = [];
    if (!unlockResult) {
      return;
    }

    if (unlockResult.failed) {
      Object.entries(unlockResult.failed).forEach(([errorDataset, fail]) => {
        const error = fail.error;
        const skip = fail.skipped;
        errors.push({ name: errorDataset, unlock_error: error });
        skipped = skip.map((dataset) => ({ name: dataset }));
      });
    }
    unlockResult.unlocked.forEach((name) => {
      unlock.push({ name });
    });
    if (!this.dialogOpen) {
      this.dialogOpen = true;
      const unlockDialogRef = this.matDialog.open(UnlockSummaryDialogComponent, { disableClose: true });
      unlockDialogRef.componentInstance.parent = this;
      unlockDialogRef.componentInstance.showFinalResults();
      unlockDialogRef.componentInstance.unlockDatasets = unlock;
      unlockDialogRef.componentInstance.errorDatasets = errors;
      unlockDialogRef.componentInstance.skippedDatasets = skipped;
      unlockDialogRef.componentInstance.data = payload;
    }
  }

  openSummaryDialog(payload: DatasetUnlockParams, encryptionSummary: DatasetEncryptionSummary[]): void {
    const errors: DatasetEncryptionSummary[] = [];
    const unlock: DatasetEncryptionSummary[] = [];
    if (encryptionSummary) {
      encryptionSummary.forEach((result) => {
        if (result.unlock_successful) {
          unlock.push(result);
        } else {
          errors.push(result);
        }
      });
    }
    if (!this.dialogOpen) { // prevent dialog from opening more than once
      this.dialogOpen = true;
      const unlockDialogRef = this.matDialog.open(UnlockSummaryDialogComponent, { disableClose: true });
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
