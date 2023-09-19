import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { ShowLogsDialogComponent } from 'app/modules/common/dialog/show-logs-dialog/show-logs-dialog.component';
import { Column, ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';

@Component({
  templateUrl: './ix-cell-state-button.component.html',
  styleUrls: ['./ix-cell-state-button.component.scss'],
})
export class IxCellStateButtonComponent<T> extends ColumnComponent<T> {
  constructor(private matDialog: MatDialog) {
    super();
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

  onButtonClick(): void {
    if (this.job) {
      this.matDialog.open(ShowLogsDialogComponent, { data: this.job });
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
      case JobState.Running:
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
