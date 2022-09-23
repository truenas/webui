import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { merge } from 'rxjs';
import { filter } from 'rxjs/operators';
import { JobState } from 'app/enums/job-state.enum';
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
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { AppTableAction, AppTableConfig } from 'app/modules/entity/table/table.component';
import { EntityUtils } from 'app/modules/entity/utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
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
import {
  DialogService, ModalServiceMessage,
  StorageService,
  TaskService,
  WebSocketService,
} from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { JobService } from 'app/services/job.service';
import { ModalService } from 'app/services/modal.service';
import { AppState } from 'app/store';
import { selectTimezone } from 'app/store/system-config/system-config.selectors';

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
  providers: [
    TaskService,
    JobService,
  ],
})
export class DataProtectionDashboardComponent implements OnInit {
  dataCards: TaskCard[] = [];
  disks: Disk[] = [];
  jobStates: { [jobId: string]: string } = {};

  constructor(
    private ws: WebSocketService,
    private modalService: ModalService,
    private slideInService: IxSlideInService,
    private dialog: DialogService,
    private loader: AppLoaderService,
    private mdDialog: MatDialog,
    private router: Router,
    private taskService: TaskService,
    private storage: StorageService,
    private translate: TranslateService,
    private job: JobService,
    private store$: Store<AppState>,
  ) {
    this.storage
      .listDisks()
      .pipe(untilDestroyed(this))
      .subscribe((disks) => {
        if (disks) {
          this.disks = disks;
        }
      });
  }

  ngOnInit(): void {
    this.getCardData();
    this.refreshAllTables();

    merge(
      this.modalService.onClose$,
      this.slideInService.onClose$,
    )
      .pipe(untilDestroyed(this))
      .subscribe(({ modalType }) => {
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

    this.modalService.message$.pipe(untilDestroyed(this)).subscribe((message: ModalServiceMessage) => {
      if (message['action'] === 'open' && message['component'] === 'replicationForm') {
        this.modalService.openInSlideIn(ReplicationFormComponent, message['row']);
      }
      if (message['action'] === 'open' && message['component'] === 'replicationWizard') {
        this.modalService.openInSlideIn(ReplicationWizardComponent, message['row']);
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
            { name: this.translate.instant('Pool'), prop: 'pool_name' },
            { name: this.translate.instant('Description'), prop: 'description', hiddenIfEmpty: true },
            { name: this.translate.instant('Frequency'), prop: 'frequency', enableMatTooltip: true },
            { name: this.translate.instant('Next Run'), prop: 'next_run', width: '80px' },
            {
              name: this.translate.instant('Enabled'),
              prop: 'enabled',
              width: '50px',
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
            this.slideInService.open(ScrubTaskFormComponent);
          },
          edit: (task: ScrubTaskUi) => {
            const slideIn = this.slideInService.open(ScrubTaskFormComponent);
            slideIn.setTaskForEdit(task);
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
            { name: this.translate.instant('Pool/Dataset'), prop: 'dataset' },
            { name: this.translate.instant('Keep for'), prop: 'keepfor' },
            { name: this.translate.instant('Frequency'), prop: 'frequency', enableMatTooltip: true },
            { name: this.translate.instant('Next Run'), prop: 'next_run' },
            {
              name: this.translate.instant('Enabled'),
              prop: 'enabled',
              width: '50px',
              checkbox: true,
              onChange: (row: PeriodicSnapshotTaskUi) => this.onCheckboxToggle(TaskCardId.Snapshot, row, 'enabled'),
            },
            {
              name: this.translate.instant('State'),
              prop: 'state',
              state: 'state',
              button: true,
            },
          ],
          dataSourceHelper: (data: PeriodicSnapshotTaskUi[]) => this.snapshotDataSourceHelper(data),
          isActionVisible: this.isActionVisible,
          parent: this,
          add: () => {
            this.slideInService.open(SnapshotTaskComponent, { wide: true });
          },
          edit: (row: PeriodicSnapshotTaskUi) => {
            const slideIn = this.slideInService.open(SnapshotTaskComponent, { wide: true });
            slideIn.setTaskForEdit(row);
          },
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
            { name: this.translate.instant('Name'), prop: 'name' },
            { name: this.translate.instant('Last Snapshot'), prop: 'task_last_snapshot' },
            {
              name: this.translate.instant('Enabled'),
              prop: 'enabled',
              width: '50px',
              checkbox: true,
              onChange: (row: ReplicationTaskUi) => this.onCheckboxToggle(TaskCardId.Replication, row as TaskTableRow, 'enabled'),
            },
            {
              name: this.translate.instant('State'),
              prop: 'state',
              button: true,
              state: 'state',
            },
          ],
          parent: this,
          add: () => {
            this.modalService.openInSlideIn(ReplicationWizardComponent);
          },
          edit: (row: ReplicationTaskUi) => {
            this.modalService.openInSlideIn(ReplicationFormComponent, row.id);
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
            { name: this.translate.instant('Description'), prop: 'description' },
            { name: this.translate.instant('Frequency'), prop: 'frequency', enableMatTooltip: true },
            {
              name: this.translate.instant('Next Run'),
              prop: 'next_run',
              width: '80px',
            },
            {
              name: this.translate.instant('Enabled'),
              width: '50px',
              prop: 'enabled',
              checkbox: true,
              onChange: (row: CloudSyncTaskUi) => this.onCheckboxToggle(TaskCardId.CloudSync, row, 'enabled'),
            },
            {
              name: this.translate.instant('State'),
              prop: 'state',
              state: 'state',
              button: true,
            },
          ],
          parent: this,
          add: () => {
            this.slideInService.open(CloudsyncFormComponent, { wide: true });
          },
          edit: (row: CloudSyncTaskUi) => {
            const form = this.slideInService.open(CloudsyncFormComponent, { wide: true });
            form.setTaskForEdit(row);
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
            { name: this.translate.instant('Path'), prop: 'path' },
            { name: this.translate.instant('Remote Host'), prop: 'remotehost' },
            { name: this.translate.instant('Frequency'), prop: 'frequency', enableMatTooltip: true },
            { name: this.translate.instant('Next Run'), prop: 'next_run' },
            {
              name: this.translate.instant('Enabled'),
              prop: 'enabled',
              width: '50px',
              checkbox: true,
              onChange: (row: RsyncTaskUi) => this.onCheckboxToggle(TaskCardId.Rsync, row as TaskTableRow, 'enabled'),
            },
            {
              name: this.translate.instant('State'),
              prop: 'state',
              state: 'state',
              button: true,
            },
          ],
          dataSourceHelper: (data: RsyncTaskUi[]) => this.rsyncDataSourceHelper(data),
          getActions: this.getRsyncActions.bind(this),
          isActionVisible: this.isActionVisible,
          parent: this,
          add: () => {
            this.slideInService.open(RsyncTaskFormComponent, { wide: true });
          },
          edit: (row: RsyncTaskUi) => {
            const form = this.slideInService.open(RsyncTaskFormComponent, { wide: true });
            form.setTaskForEdit(row);
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
            {
              name: helptext_smart.smartlist_column_disks,
              prop: 'disksLabel',
            },
            {
              name: helptext_smart.smartlist_column_type,
              prop: 'type',
            },
            { name: helptext_smart.smartlist_column_description, prop: 'desc', hiddenIfEmpty: true },
            {
              name: helptext_smart.smartlist_column_frequency,
              prop: 'frequency',
              enableMatTooltip: true,
            },
            {
              name: helptext_smart.smartlist_column_next_run,
              prop: 'next_run',
            },
          ],
          add: () => {
            this.slideInService.open(SmartTaskFormComponent);
          },
          edit: (row: SmartTestTaskUi) => {
            const slideIn = this.slideInService.open(SmartTaskFormComponent);
            slideIn.setTestForEdit(row);
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
      task.cron_schedule = `${task.schedule.minute} ${task.schedule.hour} ${task.schedule.dom} ${task.schedule.month} ${task.schedule.dow}`;
      task.frequency = this.taskService.getTaskCronDescription(task.cron_schedule);

      this.store$.select(selectTimezone).pipe(untilDestroyed(this)).subscribe((timezone) => {
        task.next_run = this.taskService.getTaskNextRun(task.cron_schedule, timezone);
      });

      return task;
    });
  }

  cloudsyncDataSourceHelper(data: CloudSyncTaskUi[]): CloudSyncTaskUi[] {
    const cloudsyncData = data.map((task) => {
      const formattedCronSchedule = `${task.schedule.minute} ${task.schedule.hour} ${task.schedule.dom} ${task.schedule.month} ${task.schedule.dow}`;
      task.credential = task.credentials.name;
      task.cron_schedule = task.enabled ? formattedCronSchedule : this.translate.instant('Disabled');
      task.frequency = this.taskService.getTaskCronDescription(formattedCronSchedule);
      task.next_run_time = task.enabled ? this.taskService.getTaskNextTime(formattedCronSchedule) : this.translate.instant('Disabled');

      this.store$.select(selectTimezone).pipe(untilDestroyed(this)).subscribe((timezone) => {
        task.next_run = task.enabled ? this.taskService.getTaskNextRun(formattedCronSchedule, timezone) : this.translate.instant('Disabled');
      });

      if (task.job === null) {
        task.state = { state: task.locked ? JobState.Locked : JobState.Pending };
      } else {
        task.state = { state: task.job.state };
        this.job.getJobStatus(task.job.id).pipe(
          untilDestroyed(this),
        ).subscribe((job: Job) => {
          task.state = { state: job.state };
          task.job = job;
          if (!!this.jobStates[job.id] && this.jobStates[job.id] !== job.state) {
            this.refreshTable(TaskCardId.CloudSync);
          }
          this.jobStates[job.id] = job.state;
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
    return data.map((task) => {
      task.task_last_snapshot = task.state.last_snapshot
        ? task.state.last_snapshot
        : this.translate.instant(helptext.no_snapshot_sent_yet);

      if (task.job !== null) {
        task.state.state = task.job.state;
        this.job.getJobStatus(task.job.id).pipe(
          untilDestroyed(this),
        ).subscribe((job: Job) => {
          task.state.state = job.state;
          task.job = job;
          if (!!this.jobStates[job.id] && this.jobStates[job.id] !== job.state) {
            this.refreshTable(TaskCardId.Replication);
          }
          this.jobStates[job.id] = job.state;
        });
      }
      return task;
    });
  }

  smartTestsDataSourceHelper(data: SmartTestTaskUi[]): SmartTestTaskUi[] {
    return data.map((test) => {
      test.cron_schedule = `0 ${test.schedule.hour} ${test.schedule.dom} ${test.schedule.month} ${test.schedule.dow}`;
      test.frequency = this.taskService.getTaskCronDescription(test.cron_schedule);

      this.store$.select(selectTimezone).pipe(untilDestroyed(this)).subscribe((timezone) => {
        test.next_run = this.taskService.getTaskNextRun(test.cron_schedule, timezone);
      });

      if (test.all_disks) {
        test.disksLabel = [this.translate.instant(helptext_smart.smarttest_all_disks_placeholder)];
      } else if (test.disks.length) {
        test.disksLabel = [
          test.disks
            .map((identifier) => {
              const fullDisk = this.disks.find((item) => item.identifier === identifier);
              if (fullDisk) {
                identifier = fullDisk.devname;
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
      task.cron_schedule = `${task.schedule.minute} ${task.schedule.hour} ${task.schedule.dom} ${task.schedule.month} ${task.schedule.dow}`;
      task.frequency = this.taskService.getTaskCronDescription(task.cron_schedule);

      this.store$.select(selectTimezone).pipe(untilDestroyed(this)).subscribe((timezone) => {
        task.next_run = this.taskService.getTaskNextRun(task.cron_schedule, timezone);
      });

      return task;
    });
  }

  rsyncDataSourceHelper(data: RsyncTaskUi[]): RsyncTaskUi[] {
    return data.map((task) => {
      task.cron_schedule = `${task.schedule.minute} ${task.schedule.hour} ${task.schedule.dom} ${task.schedule.month} ${task.schedule.dow}`;
      task.frequency = this.taskService.getTaskCronDescription(task.cron_schedule);

      this.store$.select(selectTimezone).pipe(untilDestroyed(this)).subscribe((timezone) => {
        task.next_run = this.taskService.getTaskNextRun(task.cron_schedule, timezone);
      });

      if (task.job === null) {
        task.state = { state: task.locked ? JobState.Locked : JobState.Pending };
      } else {
        task.state = { state: task.job.state };
        this.job.getJobStatus(task.job.id).pipe(
          untilDestroyed(this),
        ).subscribe((job: Job) => {
          task.state = { state: job.state };
          task.job = job;
          if (!!this.jobStates[job.id] && this.jobStates[job.id] !== job.state) {
            this.refreshTable(TaskCardId.Rsync);
          }
          this.jobStates[job.id] = job.state;
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
          this.dialog
            .confirm({
              title: this.translate.instant('Run Now'),
              message: this.translate.instant('Replicate <i>{name}</i> now?', { name: row.name }),
              hideCheckBox: true,
            })
            .pipe(filter(Boolean), untilDestroyed(this))
            .subscribe(() => {
              row.state = { state: JobState.Running };
              this.ws
                .call('replication.run', [row.id])
                .pipe(untilDestroyed(this))
                .subscribe({
                  next: (jobId: number) => {
                    this.dialog.info(
                      this.translate.instant('Task started'),
                      this.translate.instant('Replication <i>{name}</i> has started.', { name: row.name }),
                      true,
                    );
                    this.job
                      .getJobStatus(jobId)
                      .pipe(untilDestroyed(this))
                      .subscribe((job: Job) => {
                        row.state = { state: job.state };
                        row.job = job;
                        if (!!this.jobStates[job.id] && this.jobStates[job.id] !== job.state) {
                          this.refreshTable(TaskCardId.Replication);
                        }
                        this.jobStates[job.id] = job.state;
                      });
                  },
                  error: (err) => {
                    new EntityUtils().handleWsError(this, err);
                  },
                });
            });
        },
      },
      {
        name: 'restore',
        matTooltip: this.translate.instant('Restore'),
        icon: 'restore',
        onClick: (row) => {
          const dialog = this.mdDialog.open(ReplicationRestoreDialogComponent, {
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
          this.dialog
            .confirm({
              title: this.translate.instant('Run Now'),
              message: this.translate.instant('Run this cloud sync now?'),
              hideCheckBox: true,
            })
            .pipe(filter(Boolean), untilDestroyed(this))
            .subscribe(() => {
              row.state = { state: JobState.Running };
              this.ws
                .call('cloudsync.sync', [row.id])
                .pipe(untilDestroyed(this))
                .subscribe({
                  next: (jobId: number) => {
                    this.dialog.info(
                      this.translate.instant('Task Started'),
                      this.translate.instant('Cloud sync <i>{taskName}</i> has started.', { taskName: row.description }),
                      true,
                    );
                    this.job
                      .getJobStatus(jobId)
                      .pipe(untilDestroyed(this))
                      .subscribe((job: Job) => {
                        row.state = { state: job.state };
                        row.job = job;
                        if (!!this.jobStates[job.id] && this.jobStates[job.id] !== job.state) {
                          this.refreshTable(TaskCardId.CloudSync);
                        }
                        this.jobStates[job.id] = job.state;
                      });
                  },
                  error: (err) => {
                    new EntityUtils().handleWsError(this, err);
                  },
                });
            });
        },
      },
      {
        icon: 'stop',
        matTooltip: this.translate.instant('Stop'),
        name: 'stop',
        onClick: (row) => {
          this.dialog
            .confirm({
              title: this.translate.instant('Stop'),
              message: this.translate.instant('Stop this cloud sync?'),
              hideCheckBox: true,
            })
            .pipe(filter(Boolean), untilDestroyed(this))
            .subscribe(() => {
              this.ws
                .call('cloudsync.abort', [row.id])
                .pipe(untilDestroyed(this))
                .subscribe({
                  next: () => {
                    this.dialog.info(
                      this.translate.instant('Task Stopped'),
                      this.translate.instant('Cloud sync <i>{taskName}</i> stopped.', { taskName: row.description }),
                      true,
                    );
                  },
                  error: (err) => {
                    new EntityUtils().handleWsError(this, err);
                  },
                });
            });
        },
      },
      {
        icon: 'sync',
        matTooltip: helptext_cloudsync.action_button_dry_run,
        name: 'dry_run',
        onClick: (row) => {
          this.dialog
            .confirm({
              title: helptext_cloudsync.dry_run_title,
              message: helptext_cloudsync.dry_run_dialog,
              hideCheckBox: true,
            })
            .pipe(filter(Boolean), untilDestroyed(this))
            .subscribe(() => {
              this.ws
                .call('cloudsync.sync', [row.id, { dry_run: true }])
                .pipe(untilDestroyed(this))
                .subscribe({
                  next: (jobId: number) => {
                    this.dialog.info(
                      this.translate.instant('Task Started'),
                      this.translate.instant('Cloud sync <i>{taskName}</i> has started.', { taskName: row.description }),
                      true,
                    );
                    this.job
                      .getJobStatus(jobId)
                      .pipe(untilDestroyed(this))
                      .subscribe((job: Job) => {
                        row.state = { state: job.state };
                        row.job = job;
                        if (!!this.jobStates[job.id] && this.jobStates[job.id] !== job.state) {
                          this.refreshTable(TaskCardId.CloudSync);
                        }
                        this.jobStates[job.id] = job.state;
                      });
                  },
                  error: (err) => {
                    new EntityUtils().handleWsError(this, err);
                  },
                });
            });
        },
      },
      {
        icon: 'restore',
        matTooltip: this.translate.instant('Restore'),
        name: 'restore',
        onClick: (row) => {
          const dialog = this.mdDialog.open(CloudsyncRestoreDialogComponent, {
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
          this.dialog
            .confirm({
              title: this.translate.instant('Run Now'),
              message: this.translate.instant('Run this rsync now?'),
              hideCheckBox: true,
            })
            .pipe(filter(Boolean), untilDestroyed(this))
            .subscribe(() => {
              row.state = { state: JobState.Running };
              this.ws
                .call('rsynctask.run', [row.id])
                .pipe(untilDestroyed(this))
                .subscribe({
                  next: (jobId: number) => {
                    this.dialog.info(
                      this.translate.instant('Task Started'),
                      this.translate.instant('Rsync task <i>{ taskName }</i> started.', { taskName: `${row.remotehost} – ${row.remotemodule}` }),
                      true,
                    );
                    this.job
                      .getJobStatus(jobId)
                      .pipe(untilDestroyed(this))
                      .subscribe((job: Job) => {
                        row.state = { state: job.state };
                        row.job = job;
                        if (!!this.jobStates[job.id] && this.jobStates[job.id] !== job.state) {
                          this.refreshTable(TaskCardId.Rsync);
                        }
                        this.jobStates[job.id] = job.state;
                      });
                  },
                  error: (err) => {
                    new EntityUtils().handleWsError(this, err);
                  },
                });
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
    const dialogRef = this.mdDialog.open(EntityJobComponent, {
      data: { title: helptext.task_is_running },
    });
    dialogRef.componentInstance.jobId = jobId;
    dialogRef.componentInstance.wsshow();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      dialogRef.close();
    });
    dialogRef.componentInstance.aborted.pipe(untilDestroyed(this)).subscribe(() => {
      this.dialog.info(helptext.task_aborted, '', true);
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe(() => {
      dialogRef.close();
    });
  }

  stateButton(row: TaskTableRow): void {
    if (row.job) {
      if (row.job.state === JobState.Running) {
        const dialogRef = this.mdDialog.open(EntityJobComponent, { data: { title: this.translate.instant('Task is running') } });
        dialogRef.componentInstance.jobId = row.job.id;
        dialogRef.componentInstance.job = row.job;
        let subId: string = null;
        if (row.job.logs_path) {
          dialogRef.componentInstance.enableRealtimeLogs(true);
          subId = dialogRef.componentInstance.getRealtimeLogs();
        }
        dialogRef.componentInstance.wsshow();
        dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
          dialogRef.close();
          if (subId) {
            this.ws.unsubscribe('filesystem.file_tail_follow:' + row.job.logs_path);
            this.ws.unsub('filesystem.file_tail_follow:' + row.job.logs_path, subId);
          }
        });
        dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe(() => {
          dialogRef.close();
          if (subId) {
            this.ws.unsubscribe('filesystem.file_tail_follow:' + row.job.logs_path);
            this.ws.unsub('filesystem.file_tail_follow:' + row.job.logs_path, subId);
          }
        });
        dialogRef.componentInstance.aborted.pipe(untilDestroyed(this)).subscribe(() => {
          dialogRef.close();
          this.dialog.info(this.translate.instant('Task Aborted'), '');
          if (subId) {
            this.ws.unsubscribe('filesystem.file_tail_follow:' + row.job.logs_path);
            this.ws.unsub('filesystem.file_tail_follow:' + row.job.logs_path, subId);
          }
        });
      } else if (row.state.warnings && row.state.warnings.length > 0) {
        let list = '';
        row.state.warnings.forEach((warning: string) => {
          list += warning + '\n';
        });
        this.dialog.errorReport(this.translate.instant('Warning'), `<pre>${list}</pre>`);
      } else {
        this.job.showLogs(row.job);
      }
    } else {
      this.dialog.warn(globalHelptext.noLogDialog.title, globalHelptext.noLogDialog.message);
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
        error: (err) => {
          row[param] = !row[param];
          new EntityUtils().handleWsError(this, err, this.dialog);
        },
      });
  }
}
