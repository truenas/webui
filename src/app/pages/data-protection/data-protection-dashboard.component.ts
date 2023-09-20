import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { EMPTY } from 'rxjs';
import {
  filter, switchMap, tap, catchError,
} from 'rxjs/operators';
import { JobState } from 'app/enums/job-state.enum';
import { tapOnce } from 'app/helpers/operators/tap-once.operator';
import helptext from 'app/helptext/data-protection/data-protection-dashboard/data-protection-dashboard';
import globalHelptext from 'app/helptext/global-helptext';
import { Job } from 'app/interfaces/job.interface';
import { ReplicationTaskUi } from 'app/interfaces/replication-task.interface';
import { RsyncTaskUi } from 'app/interfaces/rsync-task.interface';
import { Disk } from 'app/interfaces/storage.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { ShowLogsDialogComponent } from 'app/modules/common/dialog/show-logs-dialog/show-logs-dialog.component';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { AppTableAction, AppTableConfig } from 'app/modules/entity/table/table.component';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { selectJob } from 'app/modules/jobs/store/job.selectors';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { RsyncTaskFormComponent } from 'app/pages/data-protection/rsync-task/rsync-task-form/rsync-task-form.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { StorageService } from 'app/services/storage.service';
import { TaskService } from 'app/services/task.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';

export interface TaskCard {
  name: string;
  tableConf: AppTableConfig<DataProtectionDashboardComponent>;
}

enum TaskCardId {
  Replication = 'replication',
  Rsync = 'rsync',
}

type TaskTableRow = Partial<
Omit<ReplicationTaskUi, 'naming_schema'> &
RsyncTaskUi
>;

@UntilDestroy()
@Component({
  templateUrl: './data-protection-dashboard.component.html',
  styleUrls: ['./data-protection-dashboard.component.scss'],
  providers: [TaskService],
})
export class DataProtectionDashboardComponent implements OnInit {
  dataCards: TaskCard[] = [];
  disks: Disk[] = [];
  jobStates = new Map<number, string>();

  constructor(
    private ws: WebSocketService,
    private slideInService: IxSlideInService,
    private dialogService: DialogService,
    private matDialog: MatDialog,
    private router: Router,
    private errorHandler: ErrorHandlerService,
    private taskService: TaskService,
    private storage: StorageService,
    private translate: TranslateService,
    private store$: Store<AppState>,
    private snackbar: SnackbarService,
  ) {
    this.storage
      .listDisks()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe((disks) => {
        this.disks = disks;
      });
  }

  ngOnInit(): void {
    this.getCardData();
    this.refreshAllTables();
  }

  handleSlideInClosed(slideInRef: IxSlideInRef<unknown>): void {
    slideInRef.slideInClosed$
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.refreshTable(TaskCardId.Rsync);
      });
  }

  getCardData(): void {
    this.dataCards = [
      {
        name: TaskCardId.Rsync,
        tableConf: {
          title: helptext.fieldset_rsync_tasks,
          titleHref: '/tasks/rsync',
          queryCall: 'rsynctask.query',
          deleteCall: 'rsynctask.delete',
          deleteMsg: {
            title: this.translate.instant('Rsync Task'),
            key_props: ['remotehost', 'remotemodule'],
          },
          columns: [
            { name: this.translate.instant('Path'), prop: 'path', enableMatTooltip: true },
            { name: this.translate.instant('Remote Host'), prop: 'remotehost', enableMatTooltip: true },
            { name: this.translate.instant('Frequency'), prop: 'frequency', enableMatTooltip: true },
            { name: this.translate.instant('Next Run'), prop: 'next_run', enableMatTooltip: true },
            {
              name: this.translate.instant('Enabled'),
              prop: 'enabled',
              width: '80px',
              checkbox: true,
              onChange: (row: RsyncTaskUi) => this.onCheckboxToggle(TaskCardId.Rsync, row as TaskTableRow, 'enabled'),
            },
            { name: this.translate.instant('State'), prop: 'state', button: true },
          ],
          dataSourceHelper: (data: RsyncTaskUi[]) => this.rsyncDataSourceHelper(data),
          getActions: this.getRsyncActions.bind(this),
          isActionVisible: this.isActionVisible,
          parent: this,
          add: () => {
            const slideInRef = this.slideInService.open(RsyncTaskFormComponent, { wide: true });
            this.handleSlideInClosed(slideInRef);
          },
          edit: (row: RsyncTaskUi) => {
            const slideInRef = this.slideInService.open(RsyncTaskFormComponent, { wide: true, data: row });
            this.handleSlideInClosed(slideInRef);
          },
          onButtonClick: (row: RsyncTaskUi) => {
            this.stateButton(row as TaskTableRow);
          },
        },
      },
    ];
  }

  refreshTable(taskCardId: TaskCardId): void {
    this.dataCards.forEach((card) => {
      if (card.name === taskCardId) {
        card.tableConf.tableComponent.getData();
      }
    });
  }

  refreshAllTables(): void {
    this.dataCards.forEach((card) => {
      if (card.tableConf.tableComponent) {
        card.tableConf.tableComponent.getData();
      }
    });
  }

  rsyncDataSourceHelper(data: RsyncTaskUi[]): RsyncTaskUi[] {
    return data.map((task) => {
      task.cron_schedule = scheduleToCrontab(task.schedule);
      task.frequency = this.taskService.getTaskCronDescription(task.cron_schedule);
      task.next_run = this.taskService.getTaskNextRun(task.cron_schedule);

      if (task.job === null) {
        task.state = { state: task.locked ? JobState.Locked : JobState.Pending };
      } else {
        task.state = { state: task.job.state };
        this.store$.select(selectJob(task.job.id)).pipe(
          filter(Boolean),
          untilDestroyed(this),
        ).subscribe((job: Job) => {
          task.state = { state: job.state };
          task.job = job;
          if (this.jobStates.get(job.id) !== job.state) {
            this.refreshTable(TaskCardId.Rsync);
          }
          this.jobStates.set(job.id, job.state);
        });
      }

      return task;
    });
  }

  getRsyncActions(): AppTableAction<RsyncTaskUi>[] {
    return [
      {
        icon: 'play_arrow',
        matTooltip: this.translate.instant('Run Now'),
        name: 'run',
        onClick: (row) => {
          this.dialogService.confirm({
            title: this.translate.instant('Run Now'),
            message: this.translate.instant('Run this rsync now?'),
            hideCheckbox: true,
          }).pipe(
            filter(Boolean),
            tap(() => row.state = { state: JobState.Running }),
            switchMap(() => this.ws.job('rsynctask.run', [row.id])),
            tapOnce(() => this.snackbar.success(
              this.translate.instant('Rsync task «{name}» has started.', {
                name: `${row.remotehost} – ${row.remotemodule}`,
              }),
            )),
            catchError((error: Job) => {
              this.dialogService.error(this.errorHandler.parseJobError(error));
              return EMPTY;
            }),
            untilDestroyed(this),
          ).subscribe((job: Job) => {
            row.state = { state: job.state };
            row.job = job;
            if (this.jobStates.get(job.id) !== job.state) {
              this.refreshTable(TaskCardId.Rsync);
            }
            this.jobStates.set(job.id, job.state);
          });
        },
      },
    ];
  }

  isActionVisible(name: string, row: TaskTableRow): boolean {
    if (name === 'run' && row.job && row.job.state === JobState.Running) {
      return false;
    }
    if (name === 'stop' && (row.job ? row.job && row.job.state !== JobState.Running : true)) {
      return false;
    }
    if (name === 'download_keys' && !(row.has_encrypted_dataset_keys)) {
      return false;
    }
    return true;
  }

  runningStateButton(jobId: number): void {
    const dialogRef = this.matDialog.open(EntityJobComponent, {
      data: { title: helptext.task_is_running },
    });
    dialogRef.componentInstance.jobId = jobId;
    dialogRef.componentInstance.wsshow();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      dialogRef.close();
    });
    dialogRef.componentInstance.aborted.pipe(untilDestroyed(this)).subscribe(() => {
      this.dialogService.info(helptext.task_aborted, '', true);
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe(() => {
      dialogRef.close();
    });
  }

  stateButton(row: TaskTableRow): void {
    if (row.job) {
      if (row.job.state === JobState.Running) {
        const dialogRef = this.matDialog.open(EntityJobComponent, { data: { title: this.translate.instant('Task is running') } });
        dialogRef.componentInstance.jobId = row.job.id;
        dialogRef.componentInstance.job = row.job;
        if (row.job.logs_path) {
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
      } else if (row.state.state === JobState.Hold) {
        this.dialogService.info(this.translate.instant('Task is on hold'), row.state.reason);
      } else if (row.state.warnings && row.state.warnings.length > 0) {
        let list = '';
        row.state.warnings.forEach((warning: string) => {
          list += warning + '\n';
        });
        this.dialogService.error({ title: row.state.state, message: `<pre>${list}</pre>` });
      } else if (row.state.error) {
        this.dialogService.error({ title: row.state.state, message: `<pre>${row.state.error}</pre>` });
      } else {
        this.matDialog.open(ShowLogsDialogComponent, { data: row.job });
      }
    } else {
      this.dialogService.warn(globalHelptext.noLogDialog.title, globalHelptext.noLogDialog.message);
    }
  }

  onCheckboxToggle(card: TaskCardId, row: TaskTableRow, param: 'enabled'): void {
    let updateCall: 'replication.update'
    | 'rsynctask.update';
    switch (card) {
      case TaskCardId.Replication:
        updateCall = 'replication.update';
        break;
      case TaskCardId.Rsync:
        updateCall = 'rsynctask.update';
        break;
      default:
        return;
    }

    this.ws
      .call(updateCall, [row.id, { [param]: row[param] }])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (updatedEntity) => {
          row[param] = updatedEntity[param];
        },
        error: (err: WebsocketError) => {
          row[param] = !row[param];
          this.dialogService.error(this.errorHandler.parseWsError(err));
        },
      });
  }
}
