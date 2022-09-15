import { Component, Inject, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { filter } from 'rxjs/operators';
import { PoolStatus } from 'app/enums/pool-status.enum';
import helptext from 'app/helptext/storage/volumes/volume-list';
import { PoolAttachment } from 'app/interfaces/pool-attachment.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { Process } from 'app/interfaces/process.interface';
import { SystemDatasetConfig } from 'app/interfaces/system-dataset-config.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { AppLoaderService, DialogService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  styleUrls: ['./export-disconnect-modal.component.scss'],
  templateUrl: './export-disconnect-modal.component.html',
})
export class ExportDisconnectModalComponent implements OnInit {
  readonly helptext = helptext;

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

  confirmLabelText = this.translate.instant(helptext.exportDialog.confirm);
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

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ExportDisconnectModalComponent>,
    private translate: TranslateService,
    private validatorsService: IxValidatorsService,
    private dialogService: DialogService,
    private matDialog: MatDialog,
    private loader: AppLoaderService,
    private ws: WebSocketService,
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

  // TODO: Break apart into smaller methods
  startExportDisconnectJob(): void {
    const value = this.form.value;
    const entityJobRef = this.matDialog.open(EntityJobComponent, {
      data: { title: helptext.exporting },
      disableClose: true,
    });
    entityJobRef.componentInstance.setDescription(helptext.exporting);
    entityJobRef.componentInstance.setCall('pool.export', [this.pool.id, {
      destroy: value.destroy,
      cascade: value.cascade,
      restart_services: this.restartServices,
    }]);
    entityJobRef.componentInstance.submit();
    entityJobRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isFormLoading = false;
        this.dialogRef.close(true);

        const message = this.translate.instant('Successfully exported/disconnected {pool}.', { pool: this.pool.name });
        const destroyed = this.translate.instant('All data on that pool was destroyed.');
        if (!value.destroy) {
          this.dialogService.info(helptext.exportDisconnect, message);
        } else {
          this.dialogService.info(helptext.exportDisconnect, message + ' ' + destroyed);
        }
        entityJobRef.close(true);
      },
      error: (error) => {
        this.dialogService.errorReportMiddleware(error);
      },
    });
    entityJobRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe({
      next: (failureData) => {
        let conditionalErrMessage = '';
        if (failureData.error) {
          if (failureData.exc_info.extra && failureData.exc_info.extra['code'] === 'control_services') {
            this.dialogRef.close(true);
            this.isFormLoading = false;
            entityJobRef.close(true);
            const stopMsg = this.translate.instant(helptext.exportMessages.onfail.stopServices);
            const restartMsg = this.translate.instant(helptext.exportMessages.onfail.restartServices);
            const continueMsg = this.translate.instant(helptext.exportMessages.onfail.continueMessage);
            // TODO: Extract to template
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
            conditionalErrMessage += '<br><br>' + continueMsg + '</div><br />';
            this.dialogService.confirm({
              title: helptext.exportError,
              message: conditionalErrMessage,
              hideCheckBox: true,
              buttonMsg: helptext.exportMessages.onfail.continueAction,
            }).pipe(
              filter(Boolean),
              untilDestroyed(this),
            ).subscribe(() => {
              this.restartServices = true;
              this.startExportDisconnectJob();
            });
          } else if ((failureData as any).extra && (failureData as any).extra['code'] === 'unstoppable_processes') {
            this.dialogRef.close(true);
            this.isFormLoading = false;
            const msg = this.translate.instant(helptext.exportMessages.onfail.unableToTerminate);
            conditionalErrMessage = msg + (failureData as any).extra['processes'];
            entityJobRef.close(true);
            this.dialogService.errorReport(helptext.exportError, conditionalErrMessage, failureData.exception);
          } else {
            this.dialogRef.close(true);
            this.isFormLoading = false;
            entityJobRef.close(true);
            this.dialogService.errorReport(helptext.exportError, failureData.error, failureData.exception);
          }
        } else {
          this.dialogRef.close(true);
          this.isFormLoading = false;
          entityJobRef.close(true);
          this.dialogService.errorReport(helptext.exportError, failureData.error, failureData.exception);
        }
      },
      error: (error) => {
        this.dialogService.errorReportMiddleware(error);
      },
    });
  }

  private loadRelatedEntities(): void {
    this.loader.open();

    forkJoin([
      this.ws.call('pool.attachments', [this.pool.id]),
      this.ws.call('pool.processes', [this.pool.id]),
      this.ws.call('systemdataset.config'),
    ])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: ([attachments, processes, systemConfig]) => {
          this.loader.close();
          this.attachments = attachments;
          this.processes = processes;
          this.systemConfig = systemConfig;
          this.prepareForm();
        },
        error: (error) => {
          this.loader.close();
          this.dialogService.errorReport(helptext.exportError, error.reason, error.trace.formatted);
        },
      });
  }

  private prepareForm(): void {
    this.showSysDatasetWarning = this.pool.name === this.systemConfig?.pool;
    this.showPoolDetachWarning = this.pool.status !== PoolStatus.Unknown;
    this.showUnknownStatusDetachWarning = this.pool.status === PoolStatus.Unknown;
    this.showDestroy = this.pool.status !== PoolStatus.Unknown;

    this.confirmLabelText = this.pool.status === PoolStatus.Unknown
      ? this.translate.instant(helptext.exportDialog.confirm)
        + ' ' + this.translate.instant(helptext.exportDialog.unknown_status_alt_text)
      : this.translate.instant(helptext.exportDialog.confirm);

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

    this.form.get('destroy').valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => this.resetNameInputValidState());
  }

  private resetNameInputValidState(): void {
    this.form.get('nameInput').reset();
    this.form.get('nameInput').setErrors(null);
  }
}
