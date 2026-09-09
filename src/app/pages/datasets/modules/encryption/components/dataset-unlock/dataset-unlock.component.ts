import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl, FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors,
  ValidatorFn, Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  InputType, TnButtonComponent, TnCardComponent, TnCheckboxComponent, TnDialog, TnFileInputComponent,
  TnFormFieldComponent, TnInputComponent, TnRadioGroupComponent, TnTestIdDirective,
} from '@truenas/ui-components';
import { from, of, switchMap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { DatasetEncryptionType } from 'app/enums/dataset.enum';
import { Role } from 'app/enums/role.enum';
import { helptextUnlock } from 'app/helptext/storage/volumes/datasets/dataset-unlock';
import { DatasetEncryptionSummary, DatasetEncryptionSummaryQueryParams, DatasetEncryptionSummaryQueryParamsDataset } from 'app/interfaces/dataset-encryption-summary.interface';
import { DatasetUnlockParams, DatasetUnlockResult } from 'app/interfaces/dataset-lock.interface';
import { Job } from 'app/interfaces/job.interface';
import { RadioOption } from 'app/interfaces/option.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { IxListItemComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list-item/ix-list-item.component';
import { IxListComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.component';
import { exactLength } from 'app/modules/forms/ix-forms/validators/validators';
import { ApiService } from 'app/modules/websocket/api.service';
import { UnlockSummaryDialog } from 'app/pages/datasets/modules/encryption/components/unlock-summary-dialog/unlock-summary-dialog.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { UploadService } from 'app/services/upload.service';

interface DatasetFormGroup {
  key?: FormControl<string>;
  passphrase?: FormControl<string>;
  name: FormControl<string>;
  is_passphrase: FormControl<boolean>;
  file?: FormControl<File | null>;
}

type DatasetFormValue = Partial<{ key: string; passphrase: string; is_passphrase: boolean }>;

/**
 * `minLength` and `exactLength` both pass on an empty value, so without this the form is valid
 * (and "Unlock" is clickable) while every passphrase/key is still blank — and only turns invalid
 * once the user starts typing. Datasets left blank are intentionally skipped when building the
 * payload, so this only requires that at least one of them is filled in.
 */
function requireAtLeastOneKeyOrPassphrase(message: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const datasets = (control.value || []) as DatasetFormValue[];
    const hasAnyValue = datasets.some((dataset) => {
      return dataset.is_passphrase ? Boolean(dataset.passphrase) : Boolean(dataset.key);
    });

    return hasAnyValue ? null : { requireAtLeastOneKeyOrPassphrase: { message } };
  };
}

@Component({
  selector: 'ix-dataset-unlock',
  templateUrl: './dataset-unlock.component.html',
  styleUrls: ['./dataset-unlock.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    ReactiveFormsModule,
    IxFormComponent,
    TnFormFieldComponent,
    TnRadioGroupComponent,
    TnCheckboxComponent,
    TnInputComponent,
    IxListComponent,
    IxListItemComponent,
    TranslateModule,
    TnFileInputComponent,
    TnTestIdDirective,
    TnButtonComponent,
    RequiresRolesDirective,
  ],
})
export class DatasetUnlockComponent implements OnInit {
  private api = inject(ApiService);
  private formBuilder = inject(NonNullableFormBuilder);
  private aroute = inject(ActivatedRoute);
  private dialogService = inject(DialogService);
  private errorHandler = inject(ErrorHandlerService);
  private tnDialog = inject(TnDialog);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private upload = inject(UploadService);
  private destroyRef = inject(DestroyRef);

  /**
   * The shared form wrapper owns the submit lifecycle (loading, validation-error mapping). The
   * action row's button submits natively (`type="submit"` inside the wrapper's own `<form>`), so
   * only its disabled state is read back from here.
   */
  private readonly ixForm = viewChild(IxFormComponent);

  protected readonly requiredRoles = [Role.DatasetWrite];
  protected readonly InputType = InputType;

  pk: string;
  dialogOpen = false;
  hideFileInput = false;

  form = this.formBuilder.group({
    use_file: [true],
    unlock_children: [true],
    file: [null as File | null, [Validators.required]],
    key: [''],
    datasets: this.formBuilder.array<FormGroup<DatasetFormGroup>>([], [
      requireAtLeastOneKeyOrPassphrase(
        this.translate.instant('Enter a key or passphrase for at least one dataset.'),
      ),
    ]),
    force: [false],
  });

  protected readonly useFileOptions: RadioOption[] = [{
    value: true,
    label: this.translate.instant('From a key file'),
  }, {
    value: false,
    label: this.translate.instant('Provide keys/passphrases manually'),
  }];

  readonly helptext = helptextUnlock;

  get useFile(): boolean {
    return this.form.controls.use_file.value;
  }

  ngOnInit(): void {
    this.pk = this.aroute.snapshot.params['datasetId'] as string;
    // Matches the initial `use_file` value, so the manual keys are not validated until they are shown.
    this.form.controls.datasets.disable();
    this.getEncryptionSummary();

    this.form.controls.use_file.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((useFile) => {
      if (useFile) {
        this.form.controls.file.enable();
        this.form.controls.datasets.disable();
      } else {
        this.form.controls.file.disable();
        this.form.controls.datasets.enable();
      }
    });

    // `tn-file-input` in single mode holds one `File` (or null), where `ix-file-input` always
    // held a `File[]`.
    this.form.controls.file.valueChanges.pipe(
      switchMap((file: File | null) => (!file ? of('') : from(file.text()))),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((key: string) => {
      this.form.controls.key.setValue(key);
    });
  }

  private getEncryptionSummary(): void {
    this.dialogService.jobDialog(
      this.api.job('pool.dataset.encryption_summary', [this.pk]),
      {
        title: this.translate.instant(helptextUnlock.fetchingEncryptionSummaryTitle),
        description: this.translate.instant(helptextUnlock.fetchingEncryptionSummaryMessage, { dataset: this.pk }),
      },
    )
      .afterClosed()
      .pipe(
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
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
            key: ['', exactLength(64)],
            file: [null as File | null],
            is_passphrase: [false],
          }) as FormGroup<DatasetFormGroup>);
        }

        (this.form.controls.datasets.controls[i].controls.file as FormControl)?.valueChanges.pipe(
          switchMap((file: File | null) => (!file ? of('{}') : from(file.text()))),
          takeUntilDestroyed(this.destroyRef),
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
    const values = this.form.getRawValue();
    payload.recursive = !values.use_file || values.unlock_children;

    const job$ = payload.key_file
      ? this.upload.uploadAsJob({
          file: values.file,
          method: 'pool.dataset.unlock',
          params: [this.pk, payload],
        })
      : this.api.job('pool.dataset.unlock', [this.pk, payload]);

    this.dialogService.jobDialog(job$, {
      title: this.translate.instant(helptextUnlock.unlockingDatasetsTitle),
    })
      .afterClosed()
      .pipe(
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((job) => {
        this.openUnlockDialog(payload, job.result);
      });
  }

  protected canSubmit(): boolean {
    return this.ixForm()?.canSubmit() ?? false;
  }

  /**
   * "Unlock" fetches an encryption summary rather than saving anything: success is reported by
   * the summary dialog it opens, which is also where the actual unlock is confirmed — hence
   * `suppressSuccessSnackbar` and a `null` success message.
   */
  protected handleSubmit = (): SubmitResult<boolean, Job<DatasetEncryptionSummary[]>> => {
    const values = this.form.getRawValue();
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
          file: values.file,
          method: 'pool.dataset.encryption_summary',
          params: [this.pk, payload],
        })
      : this.api.job('pool.dataset.encryption_summary', [this.pk, payload]);

    return {
      request$: this.dialogService.jobDialog(job$, {
        title: this.translate.instant(helptextUnlock.fetchingEncryptionSummaryTitle),
        description: this.translate.instant(helptextUnlock.fetchingEncryptionSummaryMessage, { dataset: this.pk }),
      })
        .afterClosed()
        .pipe(this.errorHandler.withErrorHandler()),
      successMessage: null,
      onSuccess: (job) => this.openSummaryDialog(payload as DatasetUnlockParams, job.result),
    };
  };

  private openUnlockDialog(payload: DatasetUnlockParams, unlockResult: DatasetUnlockResult): void {
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
      const unlockDialogRef = this.tnDialog.open(UnlockSummaryDialog, { disableClose: true });
      unlockDialogRef.componentInstance.parent = this;
      unlockDialogRef.componentInstance.showFinalResults();
      unlockDialogRef.componentInstance.unlockDatasets = unlock;
      unlockDialogRef.componentInstance.errorDatasets = errors;
      unlockDialogRef.componentInstance.skippedDatasets = skipped;
      unlockDialogRef.componentInstance.data = payload;
    }
  }

  private openSummaryDialog(payload: DatasetUnlockParams, encryptionSummary: DatasetEncryptionSummary[]): void {
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
      const unlockDialogRef = this.tnDialog.open(UnlockSummaryDialog, { disableClose: true });
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
