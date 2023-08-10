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
import { tapOnce } from 'app/helpers/tap-once.operator';
import helptext_cloudsync from 'app/helptext/data-protection/cloudsync/cloudsync-form';
import helptext from 'app/helptext/data-protection/data-protection-dashboard/data-protection-dashboard';
import helptext_smart from 'app/helptext/data-protection/smart/smart';
import globalHelptext from 'app/helptext/global-helptext';
import { CloudSyncTaskUi } from 'app/interfaces/cloud-sync-task.interface';
import { Job } from 'app/interfaces/job.interface';
import { PeriodicSnapshotTaskUi } from 'app/interfaces/periodic-snapshot-task.interface';
import { ReplicationTaskUi } from 'app/interfaces/replication-task.interface';
import { RsyncTaskUi } from 'app/interfaces/rsync-task.interface';
import { ScrubTaskUi } from 'app/interfaces/scrub-task.interface';
import { SmartTestTaskUi } from 'app/interfaces/smart-test.interface';
import { Disk } from 'app/interfaces/storage.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { ShowLogsDialogComponent } from 'app/modules/common/dialog/show-logs-dialog/show-logs-dialog.component';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { AppTableAction, AppTableConfig } from 'app/modules/entity/table/table.component';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { selectJob } from 'app/modules/jobs/store/job.selectors';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { CloudsyncFormComponent } from 'app/pages/data-protection/cloudsync/cloudsync-form/cloudsync-form.component';
import {
  CloudsyncRestoreDialogComponent,
} from 'app/pages/data-protection/cloudsync/cloudsync-restore-dialog/cloudsync-restore-dialog.component';
import { ReplicationFormComponent } from 'app/pages/data-protection/replication/replication-form/replication-form.component';
import {
  ReplicationRestoreDialogComponent,
} from 'app/pages/data-protection/replication/replication-restore-dialog/replication-restore-dialog.component';
import { ReplicationWizardComponent } from 'app/pages/data-protection/replication/replication-wizard/replication-wizard.component';
import { RsyncTaskFormComponent } from 'app/pages/data-protection/rsync-task/rsync-task-form/rsync-task-form.component';
import { ScrubTaskFormComponent } from 'app/pages/data-protection/scrub-task/scrub-task-form/scrub-task-form.component';
import { SmartTaskFormComponent } from 'app/pages/data-protection/smart-task/smart-task-form/smart-task-form.component';
import { SnapshotTaskComponent } from 'app/pages/data-protection/snapshot/snapshot-task/snapshot-task.component';
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
  Scrub = 'scrub',
  Snapshot = 'snapshot',
  Replication = 'replication',
  CloudSync = 'cloudsync',
  Rsync = 'rsync',
  Smart = 'smart',
}

type TaskTableRow = Partial<
ScrubTaskUi &
Omit<PeriodicSnapshotTaskUi, 'naming_schema'> &
Omit<ReplicationTaskUi, 'naming_schema'> &
CloudSyncTaskUi &
RsyncTaskUi &
SmartTestTaskUi
>;

@UntilDestroy()
@Component({
  templateUrl: './data-protection-dashboard.component.html',
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

  handleSlideInClosed(slideInRef: IxSlideInRef<unknown>, modalType: unknown): void {
    slideInRef.slideInClosed$
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        switch (modalType) {
          case ReplicationFormComponent:
          case ReplicationWizardComponent:
            this.refreshTable(TaskCardId.Replication);
            break;
          case CloudsyncFormComponent:
            this.refreshTable(TaskCardId.CloudSync);
            break;
          case ScrubTaskFormComponent:
            this.refreshTable(TaskCardId.Scrub);
            break;
          case SnapshotTaskComponent:
            this.refreshTable(TaskCardId.Snapshot);
            break;
          case RsyncTaskFormComponent:
            this.refreshTable(TaskCardId.Rsync);
            break;
          case SmartTaskFormComponent:
            this.refreshTable(TaskCardId.Smart);
            break;
        }
      });
  }

  getCardData(): void {
    this.dataCards = [
      {
        name: TaskCardId.Scrub,
        tableConf: {
          title: helptext.fieldset_scrub_tasks,
          titleHref: '/tasks/scrub',
          queryCall: 'pool.scrub.query',
          deleteCall: 'pool.scrub.delete',
          dataSourceHelper: (data: ScrubTaskUi[]) => this.scrubDataSourceHelper(data),
          emptyEntityLarge: false,
          columns: [
            { name: this.translate.instant('Pool'), prop: 'pool_name', enableMatTooltip: true },
            {
              name: this.translate.instant('Description'), prop: 'description', hiddenIfEmpty: true, enableMatTooltip: true,
            },
            { name: this.translate.instant('Frequency'), prop: 'frequency', enableMatTooltip: true },
            { name: this.translate.instant('Next Run'), prop: 'next_run', enableMatTooltip: true },
            {
              name: this.translate.instant('Enabled'),
              prop: 'enabled',
              width: '80px',
              checkbox: true,
              onChange: (row: ScrubTaskUi) => this.onCheckboxToggle(TaskCardId.Scrub, row, 'enabled'),
            },
          ],
          deleteMsg: {
            title: this.translate.instant('Scrub Task'),
            key_props: ['pool_name'],
          },
          parent: this,
          add: () => {
            const slideInRef = this.slideInService.open(ScrubTaskFormComponent);
            this.handleSlideInClosed(slideInRef, ScrubTaskFormComponent);
          },
          edit: (task: ScrubTaskUi) => {
            const slideInRef = this.slideInService.open(ScrubTaskFormComponent, { data: task });
            this.handleSlideInClosed(slideInRef, ScrubTaskFormComponent);
          },
          tableActions: [
            {
              label: this.translate.instant('Adjust Scrub/Resilver Priority'),
              onClick: () => {
                this.router.navigate(['/data-protection/scrub/priority']);
              },
            },
          ],
        },
      },
      {
        name: TaskCardId.Snapshot,
        tableConf: {
          title: helptext.fieldset_periodic_snapshot_tasks,
          titleHref: '/tasks/snapshot',
          queryCall: 'pool.snapshottask.query',
          deleteCall: 'pool.snapshottask.delete',
          deleteMsg: {
            title: this.translate.instant('Periodic Snapshot Task'),
            key_props: ['dataset', 'naming_schema', 'keepfor'],
          },
          columns: [
            { name: this.translate.instant('Pool/Dataset'), prop: 'dataset', enableMatTooltip: true },
            { name: this.translate.instant('Keep for'), prop: 'keepfor', enableMatTooltip: true },
            { name: this.translate.instant('Frequency'), prop: 'frequency', enableMatTooltip: true },
            { name: this.translate.instant('Next Run'), prop: 'next_run', enableMatTooltip: true },
            {
              name: this.translate.instant('Enabled'),
              prop: 'enabled',
              width: '80px',
              checkbox: true,
              onChange: (row: PeriodicSnapshotTaskUi) => this.onCheckboxToggle(TaskCardId.Snapshot, row, 'enabled'),
            },
            { name: this.translate.instant('State'), prop: 'state', button: true },
          ],
          dataSourceHelper: (data: PeriodicSnapshotTaskUi[]) => this.snapshotDataSourceHelper(data),
          isActionVisible: this.isActionVisible,
          parent: this,
          add: () => {
            const slideInRef = this.slideInService.open(SnapshotTaskComponent, { wide: true });
            this.handleSlideInClosed(slideInRef, SnapshotTaskComponent);
          },
          edit: (row: PeriodicSnapshotTaskUi) => {
            const slideInRef = this.slideInService.open(SnapshotTaskComponent, { wide: true, data: row });
            this.handleSlideInClosed(slideInRef, SnapshotTaskComponent);
          },
          tableFooterActions: [
            {
              label: this.translate.instant('VMware Snapshot Integration'),
              onClick: () => {
                this.router.navigate(['/data-protection', 'vmware-snapshots']);
              },
            },
            {
              label: this.translate.instant('Snapshots'),
              onClick: () => {
                this.router.navigate(['/datasets', 'snapshots']);
              },
            },
          ],
          onButtonClick: (row) => {
            this.stateButton(row);
          },
        },
      },
      {
        name: TaskCardId.Replication,
        tableConf: {
          title: helptext.fieldset_replication_tasks,
          titleHref: '/tasks/replication',
          queryCall: 'replication.query',
          deleteCall: 'replication.delete',
          deleteMsg: {
            title: this.translate.instant('Replication Task'),
            key_props: ['name'],
          },
          dataSourceHelper: (data: ReplicationTaskUi[]) => this.replicationDataSourceHelper(data),
          getActions: this.getReplicationActions.bind(this),
          isActionVisible: this.isActionVisible,
          columns: [
            { name: this.translate.instant('Name'), prop: 'name', enableMatTooltip: true },
            { name: this.translate.instant('Last Snapshot'), prop: 'task_last_snapshot', enableMatTooltip: true },
            {
              name: this.translate.instant('Enabled'),
              prop: 'enabled',
              width: '80px',
              checkbox: true,
              onChange: (row: ReplicationTaskUi) => this.onCheckboxToggle(TaskCardId.Replication, row as TaskTableRow, 'enabled'),
            },
            { name: this.translate.instant('State'), prop: 'state', button: true },
          ],
          parent: this,
          add: () => {
            const slideInRef = this.slideInService.open(ReplicationWizardComponent, { wide: true });
            this.handleSlideInClosed(slideInRef, ReplicationWizardComponent);
          },
          edit: (row: ReplicationTaskUi) => {
            const slideInRef = this.slideInService.open(ReplicationFormComponent, { wide: true, data: row });
            this.handleSlideInClosed(slideInRef, ReplicationFormComponent);
          },
          onButtonClick: (row) => {
            this.stateButton(row);
          },
        },
      },
      {
        name: TaskCardId.CloudSync,
        tableConf: {
          title: helptext.fieldset_cloud_sync_tasks,
          titleHref: '/tasks/cloudsync',
          queryCall: 'cloudsync.query',
          deleteCall: 'cloudsync.delete',
          deleteMsg: {
            title: this.translate.instant('Cloud Sync Task'),
            key_props: ['description'],
          },
          dataSourceHelper: (data: CloudSyncTaskUi[]) => this.cloudsyncDataSourceHelper(data),
          getActions: this.getCloudsyncActions.bind(this),
          isActionVisible: this.isActionVisible,
          columns: [
            { name: this.translate.instant('Description'), prop: 'description', enableMatTooltip: true },
            { name: this.translate.instant('Frequency'), prop: 'frequency', enableMatTooltip: true },
            { name: this.translate.instant('Next Run'), prop: 'next_run', enableMatTooltip: true },
            {
              name: this.translate.instant('Enabled'),
              prop: 'enabled',
              checkbox: true,
              width: '80px',
              onChange: (row: CloudSyncTaskUi) => this.onCheckboxToggle(TaskCardId.CloudSync, row, 'enabled'),
            },
            { name: this.translate.instant('State'), prop: 'state', button: true },
          ],
          parent: this,
          add: () => {
            const slideInRef = this.slideInService.open(CloudsyncFormComponent, { wide: true });
            this.handleSlideInClosed(slideInRef, CloudsyncFormComponent);
          },
          edit: (row: CloudSyncTaskUi) => {
            const slideInRef = this.slideInService.open(CloudsyncFormComponent, { wide: true, data: row });
            this.handleSlideInClosed(slideInRef, CloudsyncFormComponent);
          },
          onButtonClick: (row: CloudSyncTaskUi) => {
            this.stateButton(row);
          },
        },
      },
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
            this.handleSlideInClosed(slideInRef, RsyncTaskFormComponent);
          },
          edit: (row: RsyncTaskUi) => {
            const slideInRef = this.slideInService.open(RsyncTaskFormComponent, { wide: true, data: row });
            this.handleSlideInClosed(slideInRef, RsyncTaskFormComponent);
          },
          onButtonClick: (row: RsyncTaskUi) => {
            this.stateButton(row as TaskTableRow);
          },
        },
      },
      {
        name: TaskCardId.Smart,
        tableConf: {
          title: helptext.fieldset_smart_tests,
          titleHref: '/tasks/smart',
          queryCall: 'smart.test.query',
          deleteCall: 'smart.test.delete',
          deleteMsg: {
            title: this.translate.instant('S.M.A.R.T. Test'),
            key_props: ['type', 'desc'],
          },
          dataSourceHelper: (data: SmartTestTaskUi[]) => this.smartTestsDataSourceHelper(data),
          parent: this,
          columns: [
            { name: helptext_smart.smartlist_column_disks, prop: 'disksLabel', enableMatTooltip: true },
            { name: helptext_smart.smartlist_column_type, prop: 'type', enableMatTooltip: true },
            { name: helptext_smart.smartlist_column_description, prop: 'desc', hiddenIfEmpty: true },
            { name: helptext_smart.smartlist_column_frequency, prop: 'frequency', enableMatTooltip: true },
            { name: helptext_smart.smartlist_column_next_run, prop: 'next_run', enableMatTooltip: true },
          ],
          add: () => {
            const slideInRef = this.slideInService.open(SmartTaskFormComponent);
            this.handleSlideInClosed(slideInRef, SmartTaskFormComponent);
          },
          edit: (row: SmartTestTaskUi) => {
            const slideInRef = this.slideInService.open(SmartTaskFormComponent, { data: row });
            this.handleSlideInClosed(slideInRef, SmartTaskFormComponent);
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

  scrubDataSourceHelper(data: ScrubTaskUi[]): ScrubTaskUi[] {
    return data.map((task) => {
      task.cron_schedule = scheduleToCrontab(task.schedule);
      task.frequency = this.taskService.getTaskCronDescription(task.cron_schedule);
      task.next_run = this.taskService.getTaskNextRun(task.cron_schedule);

      return task;
    });
  }

  cloudsyncDataSourceHelper(data: CloudSyncTaskUi[]): CloudSyncTaskUi[] {
    const cloudsyncData = data.map((task) => {
      const formattedCronSchedule = scheduleToCrontab(task.schedule);
      task.credential = task.credentials.name;
      task.cron_schedule = task.enabled ? formattedCronSchedule : this.translate.instant('Disabled');
      task.frequency = this.taskService.getTaskCronDescription(formattedCronSchedule);
      task.next_run_time = task.enabled ? this.taskService.getTaskNextTime(formattedCronSchedule) : this.translate.instant('Disabled');
      task.next_run = task.enabled ? this.taskService.getTaskNextRun(formattedCronSchedule) : this.translate.instant('Disabled');

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
            this.refreshTable(TaskCardId.CloudSync);
          }
          this.jobStates.set(job.id, job.state);
        });
      }

      return task;
    });

    cloudsyncData.sort((first, second) => {
      if (typeof first.next_run_time === 'string') return 1;
      if (typeof second.next_run_time === 'string') return -1;
      return first.next_run_time.getTime() - second.next_run_time.getTime();
    });

    return cloudsyncData;
  }

  replicationDataSourceHelper(data: ReplicationTaskUi[]): ReplicationTaskUi[] {
    const tasks: ReplicationTaskUi[] = [];
    data.forEach((task) => {
      task.task_last_snapshot = task.state.last_snapshot
        ? task.state.last_snapshot
        : this.translate.instant(helptext.no_snapshot_sent_yet);

      if (task.job !== null) {
        this.store$.select(selectJob(task.job.id)).pipe(
          filter(Boolean),
          untilDestroyed(this),
        ).subscribe((job: Job) => {
          task.job = job;
          if (this.jobStates.get(job.id) !== job.state) {
            this.refreshTable(TaskCardId.Replication);
          }
          this.jobStates.set(job.id, job.state);
        });
      }
      tasks.push(task);
    });
    return tasks;
  }

  smartTestsDataSourceHelper(data: SmartTestTaskUi[]): SmartTestTaskUi[] {
    return data.map((test) => {
      test.cron_schedule = scheduleToCrontab(test.schedule);
      test.frequency = this.taskService.getTaskCronDescription(test.cron_schedule);
      test.next_run = this.taskService.getTaskNextRun(test.cron_schedule);

      if (test.all_disks) {
        test.disksLabel = [this.translate.instant(helptext_smart.smarttest_all_disks_placeholder)];
      } else if (test.disks.length) {
        test.disksLabel = [
          test.disks
            .map((identifier) => {
              const fullDisk = this.disks.find((item) => item.identifier === identifier);
              if (fullDisk) {
                return fullDisk.devname;
              }
              return identifier;
            })
            .join(','),
        ];
      }
      return test;
    });
  }

  snapshotDataSourceHelper(data: PeriodicSnapshotTaskUi[]): PeriodicSnapshotTaskUi[] {
    return data.map((task) => {
      task.keepfor = `${task.lifetime_value} ${task.lifetime_unit}(S)`;
      task.cron_schedule = scheduleToCrontab(task.schedule);
      task.frequency = this.taskService.getTaskCronDescription(task.cron_schedule);
      task.next_run = this.taskService.getTaskNextRun(task.cron_schedule);

      return task;
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

  getReplicationActions(): AppTableAction<ReplicationTaskUi>[] {
    return [
      {
        icon: 'play_arrow',
        name: 'run',
        matTooltip: this.translate.instant('Run Now'),
        onClick: (row) => {
          this.dialogService.confirm({
            title: this.translate.instant('Run Now'),
            message: this.translate.instant('Replicate «{name}» now?', { name: row.name }),
            hideCheckbox: true,
          }).pipe(
            filter(Boolean),
            tap(() => row.state.state = JobState.Running),
            switchMap(() => this.ws.job('replication.run', [row.id])),
            tapOnce(() => {
              this.snackbar.success(
                this.translate.instant('Replication «{name}» has started.', { name: row.name }),
              );
            }),
            tap((job) => {
              if (!([JobState.Running, JobState.Pending].includes(job.state))) {
                this.refreshTable(TaskCardId.Replication); return;
              }
              row.state.state = job.state;
              row.job = { ...job };
              this.jobStates.set(job.id, job.state);
            }),
            catchError((error: Job) => {
              this.dialogService.error(this.errorHandler.parseJobError(error));
              return EMPTY;
            }),
            untilDestroyed(this),
          ).subscribe();
        },
      },
      {
        name: 'restore',
        matTooltip: this.translate.instant('Restore'),
        icon: 'restore',
        onClick: (row) => {
          const dialog = this.matDialog.open(ReplicationRestoreDialogComponent, {
            data: row.id,
          });
          dialog
            .afterClosed()
            .pipe(untilDestroyed(this))
            .subscribe(() => this.refreshTable(TaskCardId.Replication));
        },
      },
    ];
  }

  getCloudsyncActions(): AppTableAction<CloudSyncTaskUi>[] {
    return [
      {
        icon: 'play_arrow',
        matTooltip: this.translate.instant('Run Now'),
        name: 'run',
        onClick: (row) => {
          this.dialogService.confirm({
            title: this.translate.instant('Run Now'),
            message: this.translate.instant('Run this cloud sync now?'),
            hideCheckbox: true,
          }).pipe(
            filter(Boolean),
            tap(() => row.state = { state: JobState.Running }),
            switchMap(() => this.ws.job('cloudsync.sync', [row.id])),
            tapOnce(() => this.snackbar.success(
              this.translate.instant('Cloud sync «{name}» has started.', { name: row.description }),
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
              this.refreshTable(TaskCardId.CloudSync);
            }
            this.jobStates.set(job.id, job.state);
          });
        },
      },
      {
        icon: 'stop',
        matTooltip: this.translate.instant('Stop'),
        name: 'stop',
        onClick: (row) => {
          this.dialogService
            .confirm({
              title: this.translate.instant('Stop'),
              message: this.translate.instant('Stop this cloud sync?'),
              hideCheckbox: true,
            })
            .pipe(
              filter(Boolean),
              switchMap(() => {
                return this.ws.call('cloudsync.abort', [row.id]).pipe(
                  this.errorHandler.catchError(),
                );
              }),
              untilDestroyed(this),
            )
            .subscribe(() => {
              this.dialogService.info(
                this.translate.instant('Task Stopped'),
                this.translate.instant('Cloud sync «{name}» stopped.', { name: row.description }),
                true,
              );
            });
        },
      },
      {
        icon: 'sync',
        matTooltip: helptext_cloudsync.action_button_dry_run,
        name: 'dry_run',
        onClick: (row) => {
          this.dialogService.confirm({
            title: helptext_cloudsync.dry_run_title,
            message: helptext_cloudsync.dry_run_dialog,
            hideCheckbox: true,
          }).pipe(
            filter(Boolean),
            switchMap(() => this.ws.job('cloudsync.sync', [row.id, { dry_run: true }])),
            tapOnce(() => this.snackbar.success(
              this.translate.instant('Cloud sync «{name}» has started.', { name: row.description }),
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
              this.refreshTable(TaskCardId.CloudSync);
            }
            this.jobStates.set(job.id, job.state);
          });
        },
      },
      {
        icon: 'restore',
        matTooltip: this.translate.instant('Restore'),
        name: 'restore',
        onClick: (row) => {
          const dialog = this.matDialog.open(CloudsyncRestoreDialogComponent, {
            data: row.id,
          });
          dialog
            .afterClosed()
            .pipe(untilDestroyed(this))
            .subscribe(() => this.refreshTable(TaskCardId.CloudSync));
        },
      },
    ];
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
      } else if (row.state.warnings && row.state.warnings.length > 0) {
        let list = '';
        row.state.warnings.forEach((warning: string) => {
          list += warning + '\n';
        });
        this.dialogService.error({
          title: this.translate.instant('Warning'),
          message: `<pre>${list}</pre>`,
        });
      } else {
        this.matDialog.open(ShowLogsDialogComponent, { data: row.job });
      }
    } else {
      this.dialogService.warn(globalHelptext.noLogDialog.title, globalHelptext.noLogDialog.message);
    }
  }

  onCheckboxToggle(card: TaskCardId, row: TaskTableRow, param: 'enabled'): void {
    let updateCall: 'pool.scrub.update'
    | 'pool.snapshottask.update'
    | 'replication.update'
    | 'cloudsync.update'
    | 'rsynctask.update';
    switch (card) {
      case TaskCardId.Scrub:
        updateCall = 'pool.scrub.update';
        break;
      case TaskCardId.Snapshot:
        updateCall = 'pool.snapshottask.update';
        break;
      case TaskCardId.Replication:
        updateCall = 'replication.update';
        break;
      case TaskCardId.CloudSync:
        updateCall = 'cloudsync.update';
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
