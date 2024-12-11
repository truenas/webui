import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import {
  AbstractControl, FormBuilder, Validators, ReactiveFormsModule,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent,
} from '@angular/material/dialog';
import { MatProgressBar } from '@angular/material/progress-bar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { isObject } from 'lodash-es';
import { forkJoin } from 'rxjs';
import { filter } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { Role } from 'app/enums/role.enum';
import { helptextVolumes } from 'app/helptext/storage/volumes/volume-list';
import { Job } from 'app/interfaces/job.interface';
import { PoolAttachment } from 'app/interfaces/pool-attachment.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { Process } from 'app/interfaces/process.interface';
import { SystemDatasetConfig } from 'app/interfaces/system-dataset-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { ApiService } from 'app/services/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-export-disconnect-modal',
  styleUrls: ['./export-disconnect-modal.component.scss'],
  templateUrl: './export-disconnect-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    MatProgressBar,
    ReactiveFormsModule,
    MatDialogContent,
    IxFieldsetComponent,
    IxCheckboxComponent,
    IxInputComponent,
    FormActionsComponent,
    MatButton,
    TestDirective,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class ExportDisconnectModalComponent implements OnInit {
  readonly helptext = helptextVolumes;

  readonly nameInputRequired = this.validatorsService.withMessage(
    Validators.required,
    this.translate.instant('Name of the pool is required'),
  );

  readonly nameInputMustMatch = this.validatorsService.withMessage(
    Validators.pattern(new RegExp(`^${this.pool.name}$`)),
    this.translate.instant('Name of the pool must be correct'),
  );

  showSysDatasetWarning: boolean;
  showPoolDetachWarning: boolean;
  showUnknownStatusDetachWarning: boolean;
  showDestroy: boolean;

  confirmLabelText = this.translate.instant(helptextVolumes.exportDialog.confirm);
  process = {
    knownProcesses: [] as Process[],
    unknownProcesses: [] as Process[],
  };

  attachments: PoolAttachment[] = [];
  processes: Process[] = [];
  systemConfig: SystemDatasetConfig;

  isFormLoading = false;
  form = this.fb.group({
    destroy: [false],
    cascade: [true],
    confirm: [false, [Validators.requiredTrue]],
    nameInput: ['', [
      this.validatorsService.validateOnCondition(
        (control: AbstractControl) => control.parent?.get('destroy').value,
        this.nameInputRequired,
      ),
      this.validatorsService.validateOnCondition(
        (control: AbstractControl) => control.parent?.get('destroy').value,
        this.nameInputMustMatch,
      ),
    ]],
  });

  restartServices = false;

  protected readonly Role = Role;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ExportDisconnectModalComponent>,
    private translate: TranslateService,
    private validatorsService: IxValidatorsService,
    private dialogService: DialogService,
    private loader: AppLoaderService,
    private api: ApiService,
    private datasetStore: DatasetTreeStore,
    private cdr: ChangeDetectorRef,
    private snackbar: SnackbarService,
    private errorHandler: ErrorHandlerService,
    @Inject(MAT_DIALOG_DATA) public pool: Pool,
  ) {}

  ngOnInit(): void {
    if (this.pool.status === PoolStatus.Unknown) {
      this.prepareForm();
      return;
    }

    this.loadRelatedEntities();
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  startExportDisconnectJob(): void {
    const value = this.form.value;

    const job$ = this.api.job('pool.export', [
      this.pool.id,
      {
        destroy: value.destroy,
        cascade: value.cascade,
        restart_services: this.restartServices,
      },
    ]);

    this.dialogService.jobDialog(
      job$,
      {
        title: this.translate.instant(helptextVolumes.exporting),
        description: this.translate.instant(helptextVolumes.exporting),
      },
    )
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.handleDisconnectJobSuccess(value);
        },
        error: (error: unknown) => {
          this.handleDisconnectJobFailure(error as Job);
        },
        complete: () => {
          this.isFormLoading = false;
          this.cdr.markForCheck();
        },
      });

    this.datasetStore.resetDatasets();
  }

  showExportErrorDialog(failureData: Job): void {
    this.dialogService.error({
      title: helptextVolumes.exportError,
      message: failureData.error,
      backtrace: failureData.exception,
    });
  }

  handleDisconnectJobFailure(failureData: Job): void {
    if (failureData.error) {
      if (
        isObject(failureData.exc_info.extra)
        && !Array.isArray(failureData.exc_info.extra)
        && failureData.exc_info.extra.code === 'control_services'
      ) {
        this.showServicesErrorsDialog(failureData);
        return;
      }
      if (failureData.extra && failureData.extra.code === 'unstoppable_processes') {
        this.showUnstoppableErrorDialog(failureData);
        return;
      }
    }
    this.showExportErrorDialog(failureData);
  }

  showUnstoppableErrorDialog(failureData: Job): void {
    let conditionalErrMessage = '';
    const msg = this.translate.instant(helptextVolumes.exportMessages.onfail.unableToTerminate);
    conditionalErrMessage = msg + (failureData.extra.processes as string);
    this.dialogService.error({
      title: helptextVolumes.exportError,
      message: conditionalErrMessage,
      backtrace: failureData.exception,
    });
  }

  showServicesErrorsDialog(failureData: Job): void {
    const stopMsg = this.translate.instant(helptextVolumes.exportMessages.onfail.stopServices);
    const restartMsg = this.translate.instant(helptextVolumes.exportMessages.onfail.restartServices);
    let conditionalErrMessage = '';
    if (isObject(failureData.exc_info.extra) && !Array.isArray(failureData.exc_info.extra)) {
      if ((failureData.exc_info.extra.stop_services as string[]).length > 0) {
        conditionalErrMessage += '<div class="warning-box">' + stopMsg;
        (failureData.exc_info.extra.stop_services as string[]).forEach((item) => {
          conditionalErrMessage += `<br>- ${item}`;
        });
      }
      if ((failureData.exc_info.extra.restart_services as string[]).length > 0) {
        if ((failureData.exc_info.extra.stop_services as string[]).length > 0) {
          conditionalErrMessage += '<br><br>';
        }
        conditionalErrMessage += '<div class="warning-box">' + restartMsg;
        (failureData.exc_info.extra.restart_services as string[]).forEach((item) => {
          conditionalErrMessage += `<br>- ${item}`;
        });
      }
    }

    const continueMsg = this.translate.instant(helptextVolumes.exportMessages.onfail.continueMessage);
    conditionalErrMessage += '<br><br>' + continueMsg + '</div><br />';

    this.dialogService.confirm({
      title: helptextVolumes.exportError,
      message: conditionalErrMessage,
      hideCheckbox: true,
      buttonText: helptextVolumes.exportMessages.onfail.continueAction,
    }).pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => {
      this.restartServices = true;
      this.startExportDisconnectJob();
      this.cdr.markForCheck();
    });
  }

  handleDisconnectJobSuccess(value: Partial<{
    destroy: boolean;
    cascade: boolean;
    confirm: boolean;
    nameInput: string;
  }>): void {
    this.isFormLoading = false;
    this.dialogRef.close(true);

    const message = this.translate.instant('Pool «{pool}» has been exported/disconnected successfully.', {
      pool: this.pool.name,
    });
    const destroyed = this.translate.instant('All data on that pool was destroyed.');
    if (!value.destroy) {
      this.snackbar.success(message);
    } else {
      this.snackbar.success(`${message} ${destroyed}`);
    }
  }

  private loadRelatedEntities(): void {
    forkJoin([
      this.api.call('pool.attachments', [this.pool.id]),
      this.api.call('pool.processes', [this.pool.id]),
      this.api.call('systemdataset.config'),
    ])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(([attachments, processes, systemConfig]) => {
        this.attachments = attachments;
        this.processes = processes;
        this.systemConfig = systemConfig;
        this.prepareForm();
        this.cdr.markForCheck();
      });
  }

  private prepareForm(): void {
    this.showSysDatasetWarning = this.pool.name === this.systemConfig?.pool;
    this.showPoolDetachWarning = this.pool.status !== PoolStatus.Unknown;
    this.showUnknownStatusDetachWarning = this.pool.status === PoolStatus.Unknown;
    this.showDestroy = this.pool.status !== PoolStatus.Unknown;

    this.confirmLabelText = this.pool.status === PoolStatus.Unknown
      ? this.translate.instant(helptextVolumes.exportDialog.confirm)
      + ' ' + this.translate.instant(helptextVolumes.exportDialog.unknown_status_alt_text)
      : this.translate.instant(helptextVolumes.exportDialog.confirm);

    this.processes.forEach((process) => {
      if (process.service) {
        return;
      }

      if (process.name && process.name !== '') {
        this.process.knownProcesses.push(process);
      } else {
        this.process.unknownProcesses.push(process);
      }
    });

    this.form.controls.destroy.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => this.resetNameInputValidState());
  }

  private resetNameInputValidState(): void {
    this.form.controls.nameInput.reset();
    this.form.controls.nameInput.setErrors(null);
  }
}
