import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { PoolStatus } from 'app/enums/pool-status.enum';
import helptext from 'app/helptext/storage/volumes/volume-list';
import { PoolAttachment } from 'app/interfaces/pool-attachment.interface';
import { PoolProcess } from 'app/interfaces/pool-process.interface';
import { SystemDatasetConfig } from 'app/interfaces/system-dataset-config.interface';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job/entity-job.component';
import IxValidatorsService from 'app/pages/common/ix-forms/services/ix-validators.service';
import { VolumesListPool } from 'app/pages/storage/volumes/volumes-list/volumes-list-pool.interface';
import { DialogService } from 'app/services';

export interface ExportDisconnectModalState {
  pool: VolumesListPool;
  attachments: PoolAttachment[];
  processes: PoolProcess[];
  systemConfig: SystemDatasetConfig;
}

interface ExportDisconnectFormValue {
  destroy: boolean;
  cascade: boolean;
}

@UntilDestroy()
@Component({
  selector: 'export-disconnect-modal',
  styleUrls: ['./export-disconnect-modal.component.scss'],
  templateUrl: './export-disconnect-modal.component.html',
})
export class ExportDisconnectModalComponent implements OnInit {
  readonly helptext = helptext;

  readonly nameInputRequired = this.validatorsService.withMessage(
    Validators.required,
    {
      forProperty: 'required',
      message: this.translate.instant('Name of the pool is required'),
    },
  );

  readonly nameInputMustMatch = this.validatorsService.withMessage(
    Validators.pattern(new RegExp(`^${this.data.pool.name}$`)),
    {
      forProperty: 'pattern',
      message: this.translate.instant('Name of the pool must be correct'),
    },
  );

  showSysDatasetWarning: boolean;
  showPoolDetachWarning: boolean;
  showUnknownStatusDetachWarning: boolean;
  showDestroy: boolean;

  saveButtonText = '' + helptext.exportDialog.saveButton;
  title: string;
  poolDetachWarning: string;
  unknownStatusDetachWarning: string;
  poolSummary: string;
  confirmLabelText: string;
  nameInputLabelText: string;

  isFormLoading = false;
  form = this.fb.group({
    destroy: [false],
    cascade: [true],
    confirm: [false, [Validators.requiredTrue]],
    nameInput: ['', [
      this.nameInputRequired,
      this.validatorsService.validateOnCondition(
        (c) => c.parent?.get('destroy').value,
        this.nameInputMustMatch,
      ),
    ]],
  });

  restartServices = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ExportDisconnectModalState,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ExportDisconnectModalComponent>,
    private translate: TranslateService,
    private validatorsService: IxValidatorsService,
    private dialogService: DialogService,
    private matDialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.showSysDatasetWarning = this.data.systemConfig && this.data.pool.name === this.data.systemConfig.pool;
    this.showPoolDetachWarning = this.data.pool.status !== PoolStatus.Unknown;
    this.showUnknownStatusDetachWarning = this.data.pool.status === PoolStatus.Unknown;
    this.showDestroy = this.data.pool.status !== PoolStatus.Unknown;

    this.title = this.translate.instant(helptext.exportDialog.title)
      + `${this.data.pool.name}'`;

    this.poolDetachWarning = this.translate.instant(helptext.exportDialog.warningA)
      + this.data.pool.name
      + this.translate.instant(helptext.exportDialog.warningB);

    this.unknownStatusDetachWarning = this.translate.instant(helptext.exportDialog.unknownStateA)
      + ` ${this.data.pool.name} `
      + this.translate.instant(helptext.exportDialog.unknownStateB);

    this.poolSummary = this.getPoolSummary(
      this.data.pool,
      this.data.attachments,
      this.data.processes,
    );

    this.confirmLabelText = this.data.pool.status === PoolStatus.Unknown
      ? this.translate.instant(helptext.exportDialog.confirm)
        + ' ' + this.translate.instant(helptext.exportDialog.unknown_status_alt_text)
      : this.translate.instant(helptext.exportDialog.confirm);

    this.nameInputLabelText = this.translate.instant('Enter ')
      + `<strong>${this.data.pool.name}</strong> `
      + this.translate.instant('below to confirm.');
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  onDestroyCheckedStateChanged($event: unknown): void {
    if (!$event) {
      this.resetNameInputValidState();
    }
  }

  onConfirmCheckedStateChanged(): void {
    if (!this.form.get('destroy').value) {
      this.resetNameInputValidState();
    }
  }

  onSubmit(): void {
    this.isFormLoading = true;

    const value = this.form.value as ExportDisconnectFormValue;

    this.startExportDisconnectJob(this.data.pool, value);
  }

  private resetNameInputValidState(): void {
    this.form.get('nameInput').reset();
    this.form.get('nameInput').setErrors(null);
  }

  private getPoolSummary(
    pool: VolumesListPool,
    attachments: PoolAttachment[],
    processes: PoolProcess[],
  ): string {
    let summary = '';

    if (attachments.length) {
      summary += this.translate.instant(helptext.exportMessages.services, { name: pool.name });
      summary += this.getSummaryAttachments(attachments);
    }

    if (processes.length) {
      summary += this.getSummaryProcesses(processes, pool);
    }

    return summary;
  }

  private getSummaryAttachments(attachments: PoolAttachment[]): string {
    function formatAttachmentLine(line: string): string {
      return `<br> - ${line}`;
    }
    function formatAttachmentPart(part: string): string {
      return part.split(',').map((line) => formatAttachmentLine(line)).join('');
    }
    function formatAttachment(a: PoolAttachment): string {
      return `<br><b>${a.type}:</b>` + a.attachments.map((x) => formatAttachmentPart(x)).join('');
    }

    const summary = attachments.map((a) => formatAttachment(a)).join('');
    return summary + '<br /><br />';
  }

  private getSummaryProcesses(processes: PoolProcess[], pool: VolumesListPool): string {
    const running: PoolProcess[] = [];
    const unknown: PoolProcess[] = [];
    processes.forEach((p) => {
      if (!p.service && p.name) {
        running.push(p);
      } else {
        unknown.push(p);
      }
    });

    function formatProcessLine(p: PoolProcess): string {
      if (!p.service && p.name) {
        return `<br> - ${p.name}`;
      }
      return `<br> - ${p.pid} - ${p.cmdline.substring(0, 40)}`;
    }

    let summary = '';

    if (running.length) {
      let runningSummary = this.translate.instant(helptext.exportMessages.running);
      runningSummary += `<b>${pool.name}</b>:`;
      runningSummary += running.map((x) => formatProcessLine(x)).join('');

      summary += runningSummary;
    }

    if (unknown.length) {
      let unknownSummary = '<br><br>' + this.translate.instant(helptext.exportMessages.unknown);
      unknownSummary += unknown.filter((p) => p.pid).map((p) => formatProcessLine(p)).join('');
      unknownSummary += '<br><br>' + this.translate.instant(helptext.exportMessages.terminated);

      summary += unknownSummary;
    }

    return summary;
  }

  private startExportDisconnectJob(pool: VolumesListPool, value: ExportDisconnectFormValue): void {
    const entityJobRef = this.matDialog.open(EntityJobComponent, {
      data: { title: helptext.exporting },
      disableClose: true,
    });
    entityJobRef.updateSize('300px');
    entityJobRef.componentInstance.setDescription(helptext.exporting);
    entityJobRef.componentInstance.setCall('pool.export', [pool.id, {
      destroy: value.destroy,
      cascade: value.cascade,
      restart_services: this.restartServices,
    }]);
    entityJobRef.componentInstance.submit();
    entityJobRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.isFormLoading = false;
      this.dialogRef.close(true);

      const msg = this.translate.instant(helptext.exportSuccess);
      const destroyed = this.translate.instant(helptext.destroyed);
      if (!value.destroy) {
        this.dialogService.info(helptext.exportDisconnect, msg + pool.name + "'", '500px', 'info');
      } else {
        this.dialogService.info(helptext.exportDisconnect, msg + pool.name + destroyed, '500px', 'info');
      }
      entityJobRef.close(true);
    });
    entityJobRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((res) => {
      let conditionalErrMessage = '';
      if (res.error) {
        if (res.exc_info.extra && res.exc_info.extra['code'] === 'control_services') {
          this.dialogRef.close(true);
          this.isFormLoading = false;
          entityJobRef.close(true);
          const stopMsg = this.translate.instant(helptext.exportMessages.onfail.stopServices);
          const restartMsg = this.translate.instant(helptext.exportMessages.onfail.restartServices);
          const continueMsg = this.translate.instant(helptext.exportMessages.onfail.continueMessage);
          if ((res.exc_info.extra.stop_services as string[]).length > 0) {
            conditionalErrMessage += '<div class="warning-box">' + stopMsg;
            (res.exc_info.extra.stop_services as string[]).forEach((item) => {
              conditionalErrMessage += `<br>- ${item}`;
            });
          }
          if ((res.exc_info.extra.restart_services as string[]).length > 0) {
            if ((res.exc_info.extra.stop_services as string[]).length > 0) {
              conditionalErrMessage += '<br><br>';
            }
            conditionalErrMessage += '<div class="warning-box">' + restartMsg;
            (res.exc_info.extra.restart_services as string[]).forEach((item) => {
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
            this.startExportDisconnectJob(pool, value);
          });
        } else if ((res as any).extra && (res as any).extra['code'] === 'unstoppable_processes') {
          this.dialogRef.close(true);
          this.isFormLoading = false;
          const msg = this.translate.instant(helptext.exportMessages.onfail.unableToTerminate);
          conditionalErrMessage = msg + (res as any).extra['processes'];
          entityJobRef.close(true);
          this.dialogService.errorReport(helptext.exportError, conditionalErrMessage, res.exception);
        } else {
          this.dialogRef.close(true);
          this.isFormLoading = false;
          entityJobRef.close(true);
          this.dialogService.errorReport(helptext.exportError, res.error, res.exception);
        }
      } else {
        this.dialogRef.close(true);
        this.isFormLoading = false;
        entityJobRef.close(true);
        this.dialogService.errorReport(helptext.exportError, res.error, res.exception);
      }
    });
  }
}
