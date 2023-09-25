import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { JobState } from 'app/enums/job-state.enum';
import globalHelptext from 'app/helptext/global-helptext';
import { Job } from 'app/interfaces/job.interface';
import { ShowLogsDialogComponent } from 'app/modules/common/dialog/show-logs-dialog/show-logs-dialog.component';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { Column, ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';
import { DialogService } from 'app/services/dialog.service';

interface RowState {
  state: {
    state: JobState;
    error: string;
    warnings: string[];
    reason: string;
  };
}

@UntilDestroy()
@Component({
  templateUrl: './ix-cell-state-button.component.html',
  styleUrls: ['./ix-cell-state-button.component.scss'],
})
export class IxCellStateButtonComponent<T> extends ColumnComponent<T> {
  matDialog: MatDialog;
  translate: TranslateService;
  dialogService: DialogService;

  constructor() {
    super();
    this.matDialog = inject(MatDialog);
    this.translate = inject(TranslateService);
    this.dialogService = inject(DialogService);
  }

  getWarnings?: (row: T) => unknown[];
  getJob?: (row: T) => Job;

  protected get warnings(): unknown[] {
    return this.getWarnings ? this.getWarnings(this.row) : [];
  }

  protected get job(): Job {
    return this.getJob ? this.getJob(this.row) : undefined;
  }

  protected get state(): JobState {
    return this.value as JobState;
  }

  protected onButtonClick(): void {
    if (this.job) {
      const state = (this.row as RowState).state;

      if (this.job.state === JobState.Running) {
        const dialogRef = this.matDialog.open(EntityJobComponent, {
          data: {
            title: this.translate.instant('Task is running'),
          },
        });

        dialogRef.componentInstance.jobId = this.job.id;
        dialogRef.componentInstance.job = this.job;
        if (this.job.logs_path) {
          dialogRef.componentInstance.enableRealtimeLogs(true);
        }
        dialogRef.componentInstance.wsshow();
        dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
          dialogRef.close();
        });
        dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe(() => {
          dialogRef.close();
        });
        dialogRef.componentInstance.aborted.pipe(untilDestroyed(this)).subscribe(() => {
          dialogRef.close();
          this.dialogService.info(this.translate.instant('Task Aborted'), '');
        });
      } else if (state.state === JobState.Hold) {
        this.dialogService.info(this.translate.instant('Task is on hold'), state.reason);
      } else if (state.warnings && state.warnings.length > 0) {
        let list = '';
        state.warnings.forEach((warning: string) => {
          list += warning + '\n';
        });
        this.dialogService.error({ title: state.state, message: `<pre>${list}</pre>` });
      } else if (state.error) {
        this.dialogService.error({ title: state.state, message: `<pre>${state.error}</pre>` });
      } else {
        this.matDialog.open(ShowLogsDialogComponent, { data: this.job });
      }
    } else {
      this.dialogService.warn(globalHelptext.noLogDialog.title, globalHelptext.noLogDialog.message);
    }
  }

  protected getButtonClass(): string {
    // Bring warnings to user's attention even if state is finished or successful.
    if (this.warnings && this.warnings.length > 0) {
      return 'fn-theme-orange';
    }

    switch (this.state) {
      case JobState.Pending:
      case JobState.Aborted:
      case JobState.Running:
        return 'fn-theme-orange';
      case JobState.Finished:
      case JobState.Success:
        return 'fn-theme-green';
      case JobState.Error:
      case JobState.Failed:
        return 'fn-theme-red';
      case JobState.Locked:
      case JobState.Hold:
        return 'fn-theme-yellow';
      default:
        return 'fn-theme-primary';
    }
  }
}

export function stateButtonColumn<T>(
  options: Partial<IxCellStateButtonComponent<T>>,
): Column<T, IxCellStateButtonComponent<T>> {
  return { type: IxCellStateButtonComponent, ...options };
}
