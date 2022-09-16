import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { JobState } from 'app/enums/job-state.enum';
import helptext from 'app/helptext/data-protection/cloudsync/cloudsync-form';
import globalHelptext from 'app/helptext/global-helptext';
import { CloudSyncTask, CloudSyncTaskUi } from 'app/interfaces/cloud-sync-task.interface';
import { Job } from 'app/interfaces/job.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import {
  EntityTableComponent,
} from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/modules/entity/entity-table/entity-table.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { CloudsyncFormComponent } from 'app/pages/data-protection/cloudsync/cloudsync-form/cloudsync-form.component';
import {
  CloudsyncRestoreDialogComponent,
} from 'app/pages/data-protection/cloudsync/cloudsync-restore-dialog/cloudsync-restore-dialog.component';
import {
  AppLoaderService,
  CloudCredentialService,
  DialogService,
  JobService,
  TaskService,
  WebSocketService,
} from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { AppState } from 'app/store';
import { selectTimezone } from 'app/store/system-config/system-config.selectors';

@UntilDestroy()
@Component({
  template: '<ix-entity-table [title]="title" [conf]="this"></ix-entity-table>',
  providers: [JobService, TaskService, CloudCredentialService],
})
export class CloudsyncListComponent implements EntityTableConfig<CloudSyncTaskUi> {
  title = this.translate.instant('Cloud Sync Tasks');
  queryCall = 'cloudsync.query' as const;
  routeAdd: string[] = ['tasks', 'cloudsync', 'add'];
  routeAddTooltip = this.translate.instant('Add Cloud Sync Task');
  routeEdit: string[] = ['tasks', 'cloudsync', 'edit'];
  wsDelete = 'cloudsync.delete' as const;
  entityList: EntityTableComponent;
  asyncView = true;
  filterValue = '';

  columns = [
    { name: this.translate.instant('Description'), prop: 'description', always_display: true },
    { name: this.translate.instant('Credential'), prop: 'credential', hidden: true },
    { name: this.translate.instant('Direction'), prop: 'direction', hidden: true },
    { name: this.translate.instant('Transfer Mode'), prop: 'transfer_mode', hidden: true },
    { name: this.translate.instant('Path'), prop: 'path', hidden: true },
    {
      name: this.translate.instant('Schedule'),
      prop: 'cron_schedule',
      hidden: true,
      widget: {
        icon: 'calendar-range',
        component: 'TaskScheduleListComponent',
      },
    },
    { name: this.translate.instant('Frequency'), prop: 'frequency', enableMatTooltip: true },
    { name: this.translate.instant('Next Run'), prop: 'next_run', hidden: true },
    {
      name: this.translate.instant('Status'),
      prop: 'state',
      state: 'state',
      button: true,
    },
    { name: this.translate.instant('Enabled'), prop: 'enabled' },
  ];
  rowIdentifier = 'description';
  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: this.translate.instant('Cloud Sync Task'),
      key_props: ['description'],
    },
  };

  constructor(
    protected ws: WebSocketService,
    protected translate: TranslateService,
    protected dialog: DialogService,
    protected job: JobService,
    protected slideInService: IxSlideInService,
    protected loader: AppLoaderService,
    protected taskService: TaskService,
    private matDialog: MatDialog,
    private route: ActivatedRoute,
    private store$: Store<AppState>,
  ) {
    this.filterValue = this.route.snapshot.paramMap.get('dataset') || '';
  }

  afterInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;
    this.slideInService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      this.entityList.getData();
    });
  }

  resourceTransformIncomingRestData(tasks: CloudSyncTask[]): CloudSyncTaskUi[] {
    return tasks.map((task) => {
      const transformed = { ...task } as CloudSyncTaskUi;
      const formattedCronSchedule = `${task.schedule.minute} ${task.schedule.hour} ${task.schedule.dom} ${task.schedule.month} ${task.schedule.dow}`;
      transformed.credential = task.credentials.name;
      transformed.cron_schedule = task.enabled ? formattedCronSchedule : this.translate.instant('Disabled');
      transformed.frequency = this.taskService.getTaskCronDescription(formattedCronSchedule);

      this.store$.select(selectTimezone).pipe(untilDestroyed(this)).subscribe((timezone) => {
        transformed.next_run = task.enabled ? this.taskService.getTaskNextRun(formattedCronSchedule, timezone) : this.translate.instant('Disabled');
      });

      if (task.job === null) {
        transformed.state = { state: transformed.locked ? JobState.Locked : JobState.Pending };
      } else {
        transformed.state = { state: task.job.state };
        this.job.getJobStatus(task.job.id).pipe(untilDestroyed(this)).subscribe((job: Job) => {
          transformed.state = { state: job.state };
          transformed.job = job;
        });
      }

      return transformed;
    });
  }

  getActions(parentrow: CloudSyncTaskUi): EntityTableAction[] {
    return [
      {
        actionName: parentrow.description,
        id: 'run_now',
        label: this.translate.instant('Run Now'),
        icon: 'play_arrow',
        name: 'run',
        onClick: (row: CloudSyncTaskUi) => {
          this.dialog
            .confirm({ title: this.translate.instant('Run Now'), message: this.translate.instant('Run this cloud sync now?'), hideCheckBox: true })
            .pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
              row.state = { state: JobState.Running };
              this.ws.call('cloudsync.sync', [row.id]).pipe(untilDestroyed(this)).subscribe({
                next: (jobId: number) => {
                  this.dialog.info(
                    this.translate.instant('Task Started'),
                    this.translate.instant('Cloud sync <i>{taskName}</i> has started.', { taskName: row.description }),
                    true,
                  );
                  this.job.getJobStatus(jobId).pipe(untilDestroyed(this)).subscribe((job: Job) => {
                    row.state = { state: job.state };
                    row.job = job;
                  });
                },
                error: (err) => {
                  new EntityUtils().handleWsError(this.entityList, err);
                },
              });
            });
        },
      },
      {
        actionName: parentrow.description,
        id: 'stop',
        name: 'stop',
        label: this.translate.instant('Stop'),
        icon: 'stop',
        onClick: (row: CloudSyncTaskUi) => {
          this.dialog
            .confirm({
              title: this.translate.instant('Stop'),
              message: this.translate.instant('Stop this cloud sync?'),
              hideCheckBox: true,
            })
            .pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
              this.ws.call('cloudsync.abort', [row.id]).pipe(untilDestroyed(this)).subscribe({
                next: () => {
                  this.dialog.info(
                    this.translate.instant('Task Stopped'),
                    this.translate.instant('Cloud sync <i>{taskName}</i> stopped.', { taskName: row.description }),
                    true,
                  );
                },
                error: (wsErr) => {
                  new EntityUtils().handleWsError(this.entityList, wsErr);
                },
              });
            });
        },
      },
      {
        actionName: parentrow.description,
        id: 'dryrun',
        name: 'dryrun',
        label: helptext.action_button_dry_run,
        icon: 'sync',
        onClick: (row: CloudSyncTaskUi) => {
          this.dialog
            .confirm({
              title: helptext.dry_run_title,
              message: helptext.dry_run_dialog,
              hideCheckBox: true,
            })
            .pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
              this.ws.call('cloudsync.sync', [row.id, { dry_run: true }]).pipe(untilDestroyed(this)).subscribe({
                next: (jobId: number) => {
                  this.dialog.info(
                    this.translate.instant('Task Started'),
                    this.translate.instant('Cloud sync <i>{taskName}</i> has started.', { taskName: row.description }),
                    true,
                  );
                  this.job.getJobStatus(jobId).pipe(untilDestroyed(this)).subscribe((job: Job) => {
                    row.state = { state: job.state };
                    row.job = job;
                  });
                },
                error: (err) => {
                  new EntityUtils().handleWsError(this.entityList, err);
                },
              });
            });
        },
      },
      {
        actionName: parentrow.description,
        id: 'restore',
        name: 'restore',
        label: this.translate.instant('Restore'),
        icon: 'restore',
        onClick: (row: CloudSyncTaskUi) => {
          const dialog = this.matDialog.open(CloudsyncRestoreDialogComponent, {
            data: row.id,
          });
          dialog
            .afterClosed()
            .pipe(untilDestroyed(this))
            .subscribe(() => {
              this.entityList.needRefreshTable = true;
              this.entityList.getData();
            });
        },
      },
      {
        id: 'edit',
        actionName: parentrow.description,
        name: 'edit',
        icon: 'edit',
        label: this.translate.instant('Edit'),
        onClick: (row: CloudSyncTaskUi) => {
          this.doEdit(row.id);
        },
      },
      {
        actionName: parentrow.description,
        id: 'delete',
        name: 'delete',
        label: this.translate.instant('Delete'),
        icon: 'delete',
        onClick: (row: CloudSyncTaskUi) => {
          this.entityList.doDelete(row);
        },
      },
    ];
  }

  isActionVisible(actionId: string, row: CloudSyncTaskUi): boolean {
    if (actionId === 'run_now' && row.job && row.job.state === JobState.Running) {
      return false;
    }
    if (actionId === 'stop' && (row.job ? row.job && row.job.state !== JobState.Running : true)) {
      return false;
    }
    return true;
  }

  onButtonClick(row: CloudSyncTaskUi): void {
    this.stateButton(row);
  }

  stateButton(row: CloudSyncTaskUi): void {
    if (row.job) {
      if (row.state.state === JobState.Running) {
        const dialogRef = this.matDialog.open(EntityJobComponent, { data: { title: this.translate.instant('Task is running') } });
        dialogRef.componentInstance.jobId = row.job.id;
        dialogRef.componentInstance.job = row.job;
        dialogRef.componentInstance.enableRealtimeLogs(true);
        const subId = dialogRef.componentInstance.getRealtimeLogs();
        dialogRef.componentInstance.wsshow();
        dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
          dialogRef.close();
          this.ws.unsubscribe('filesystem.file_tail_follow:' + row.job.logs_path);
          this.ws.unsub('filesystem.file_tail_follow:' + row.job.logs_path, subId);
        });
        dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe(() => {
          dialogRef.close();
          this.ws.unsubscribe('filesystem.file_tail_follow:' + row.job.logs_path);
          this.ws.unsub('filesystem.file_tail_follow:' + row.job.logs_path, subId);
        });
        dialogRef.componentInstance.aborted.pipe(untilDestroyed(this)).subscribe(() => {
          dialogRef.close();
          this.dialog.info(this.translate.instant('Task Aborted'), '');
          this.ws.unsubscribe('filesystem.file_tail_follow:' + row.job.logs_path);
          this.ws.unsub('filesystem.file_tail_follow:' + row.job.logs_path, subId);
        });
      } else {
        this.job.showLogs(row.job);
      }
    } else {
      this.dialog.warn(globalHelptext.noLogDialog.title, globalHelptext.noLogDialog.message);
    }
  }

  doAdd(): void {
    this.slideInService.open(CloudsyncFormComponent, { wide: true });
  }

  doEdit(id: number): void {
    const row: CloudSyncTaskUi = this.entityList.rows.find((row) => row.id === id);
    const form = this.slideInService.open(CloudsyncFormComponent, { wide: true });
    form.setTaskForEdit(row);
  }
}
