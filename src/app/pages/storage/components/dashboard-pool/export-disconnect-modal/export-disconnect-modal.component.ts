import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import { forkJoin } from 'rxjs';
import { filter } from 'rxjs/operators';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { Role } from 'app/enums/role.enum';
import { helptextVolumes } from 'app/helptext/storage/volumes/volume-list';
import { Job } from 'app/interfaces/job.interface';
import { PoolAttachment } from 'app/interfaces/pool-attachment.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { Process } from 'app/interfaces/process.interface';
import { SystemDatasetConfig } from 'app/interfaces/system-dataset-config.interface';
import { WebSocketError } from 'app/interfaces/websocket-error.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  styleUrls: ['./export-disconnect-modal.component.scss'],
  templateUrl: './export-disconnect-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    private errorHandler: ErrorHandlerService,
    private validatorsService: IxValidatorsService,
    private dialogService: DialogService,
    private matDialog: MatDialog,
    private loader: AppLoaderService,
    private ws: WebSocketService,
    private datasetStore: DatasetTreeStore,
    private cdr: ChangeDetectorRef,
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

    const job$ = this.ws.job('pool.export', [
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
        _.isObject(failureData.exc_info.extra)
        && !Array.isArray(failureData.exc_info.extra)
        && failureData.exc_info.extra.code === 'control_services'
      ) {
        this.showServicesErrorsDialog(failureData); return;
      }
      if (failureData.extra && failureData.extra.code === 'unstoppable_processes') {
        this.showUnstoppableErrorDialog(failureData); return;
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
    if (_.isObject(failureData.exc_info.extra) && !Array.isArray(failureData.exc_info.extra)) {
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

    const message = this.translate.instant('Successfully exported/disconnected {pool}.', { pool: this.pool.name });
    const destroyed = this.translate.instant('All data on that pool was destroyed.');
    if (!value.destroy) {
      this.dialogService.info(helptextVolumes.exportDisconnect, message);
    } else {
      this.dialogService.info(helptextVolumes.exportDisconnect, message + ' ' + destroyed);
    }
  }

  private loadRelatedEntities(): void {
    forkJoin([
      this.ws.call('pool.attachments', [this.pool.id]),
      this.ws.call('pool.processes', [this.pool.id]),
      this.ws.call('systemdataset.config'),
    ])
      .pipe(this.loader.withLoader(), untilDestroyed(this))
      .subscribe({
        next: ([attachments, processes, systemConfig]) => {
          this.attachments = attachments;
          this.processes = processes;
          this.systemConfig = systemConfig;
          this.prepareForm();
          this.cdr.markForCheck();
        },
        error: (error: WebSocketError) => {
          this.dialogService.error({
            title: helptextVolumes.exportError,
            message: error.reason,
            backtrace: error.trace?.formatted,
          });
        },
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
