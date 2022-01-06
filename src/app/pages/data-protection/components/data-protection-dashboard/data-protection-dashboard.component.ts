import { Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { ExplorerType } from 'app/enums/explorer-type.enum';
import { JobState } from 'app/enums/job-state.enum';
import { TransferMode } from 'app/enums/transfer-mode.enum';
import helptext_cloudsync from 'app/helptext/data-protection/cloudsync/cloudsync-form';
import helptext from 'app/helptext/data-protection/data-protection-dashboard/data-protection-dashboard';
import helptext_replication from 'app/helptext/data-protection/replication/replication';
import helptext_smart from 'app/helptext/data-protection/smart/smart';
import globalHelptext from 'app/helptext/global-helptext';
import { CloudSyncTaskUi } from 'app/interfaces/cloud-sync-task.interface';
import { Job } from 'app/interfaces/job.interface';
import { PeriodicSnapshotTaskUi } from 'app/interfaces/periodic-snapshot-task.interface';
import { ReplicationTaskUi } from 'app/interfaces/replication-task.interface';
import { RsyncTaskUi } from 'app/interfaces/rsync-task.interface';
import { ScrubTaskUi } from 'app/interfaces/scrub-task.interface';
import { SmartTestUi } from 'app/interfaces/smart-test.interface';
import { Disk } from 'app/interfaces/storage.interface';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { FormParagraphConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job/entity-job.component';
import { AppTableAction, AppTableConfig } from 'app/pages/common/entity/table/table.component';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { CloudsyncFormComponent } from 'app/pages/data-protection/cloudsync/cloudsync-form/cloudsync-form.component';
import { ReplicationFormComponent } from 'app/pages/data-protection/replication/replication-form/replication-form.component';
import { ReplicationWizardComponent } from 'app/pages/data-protection/replication/replication-wizard/replication-wizard.component';
import { RsyncFormComponent } from 'app/pages/data-protection/rsync/rsync-form/rsync-form.component';
import { ScrubFormComponent } from 'app/pages/data-protection/scrub/scrub-form/scrub-form.component';
import { SmartFormComponent } from 'app/pages/data-protection/smart/smart-form/smart-form.component';
import { SnapshotFormComponent } from 'app/pages/data-protection/snapshot/snapshot-form/snapshot-form.component';
import {
  DialogService, ModalServiceMessage,
  StorageService,
  TaskService,
  WebSocketService,
} from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { JobService } from 'app/services/job.service';
import { ModalService } from 'app/services/modal.service';

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
SmartTestUi
>;

@UntilDestroy()
@Component({
  selector: 'app-data-protection-dashboard',
  templateUrl: './data-protection-dashboard.component.html',
  providers: [
    TaskService,
    JobService,
  ],
})
export class DataProtectionDashboardComponent implements OnInit {
  dataCards: TaskCard[] = [];
  disks: Disk[] = [];

  constructor(
    private ws: WebSocketService,
    private modalService: ModalService,
    private dialog: DialogService,
    private loader: AppLoaderService,
    private mdDialog: MatDialog,
    private router: Router,
    private taskService: TaskService,
    private storage: StorageService,
    private translate: TranslateService,
    private job: JobService,
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

    this.refreshTables();
    this.modalService.refreshTable$.pipe(untilDestroyed(this)).subscribe(() => {
      this.refreshTables();
    });
    this.modalService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      this.refreshTables();
    });

    this.modalService.message$.pipe(untilDestroyed(this)).subscribe((res: ModalServiceMessage) => {
      if (res['action'] === 'open' && res['component'] === 'replicationForm') {
        this.modalService.openInSlideIn(ReplicationFormComponent, res['row']);
      }
      if (res['action'] === 'open' && res['component'] === 'replicationWizard') {
        this.modalService.openInSlideIn(ReplicationWizardComponent, res['row']);
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
          dataSourceHelper: (data) => this.scrubDataSourceHelper(data),
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
            this.modalService.openInSlideIn(ScrubFormComponent);
          },
          edit: (row: ScrubTaskUi) => {
            this.modalService.openInSlideIn(ScrubFormComponent, row.id);
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
          dataSourceHelper: (data) => this.snapshotDataSourceHelper(data),
          isActionVisible: this.isActionVisible,
          parent: this,
          add: () => {
            this.modalService.openInSlideIn(SnapshotFormComponent);
          },
          edit: (row: PeriodicSnapshotTaskUi) => {
            this.modalService.openInSlideIn(SnapshotFormComponent, row.id);
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
          dataSourceHelper: (data) => this.replicationDataSourceHelper(data),
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
              onChange: (row: ReplicationTaskUi) => this.onCheckboxToggle(TaskCardId.Replication, row, 'enabled'),
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
          dataSourceHelper: (data) => this.cloudsyncDataSourceHelper(data),
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
            this.modalService.openInSlideIn(CloudsyncFormComponent);
          },
          edit: (row: CloudSyncTaskUi) => {
            this.modalService.openInSlideIn(CloudsyncFormComponent, row.id);
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
              onChange: (row: RsyncTaskUi) => this.onCheckboxToggle(TaskCardId.Rsync, row, 'enabled'),
            },
            {
              name: this.translate.instant('State'),
              prop: 'state',
              state: 'state',
              button: true,
            },
          ],
          dataSourceHelper: (data) => this.rsyncDataSourceHelper(data),
          getActions: this.getRsyncActions.bind(this),
          isActionVisible: this.isActionVisible,
          parent: this,
          add: () => {
            this.modalService.openInSlideIn(RsyncFormComponent);
          },
          edit: (row: RsyncTaskUi) => {
            this.modalService.openInSlideIn(RsyncFormComponent, row.id);
          },
          onButtonClick: (row: RsyncTaskUi) => {
            this.stateButton(row);
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
          dataSourceHelper: (data) => this.smartTestsDataSourceHelper(data),
          parent: this,
          columns: [
            {
              name: helptext_smart.smartlist_column_disks,
              prop: 'disks',
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
            this.modalService.openInSlideIn(SmartFormComponent);
          },
          edit: (row: SmartTestUi) => {
            this.modalService.openInSlideIn(SmartFormComponent, row.id);
          },
        },
      },
    ];
  }

  refreshTables(): void {
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
      task.next_run = this.taskService.getTaskNextRun(task.cron_schedule);

      return task;
    });
  }

  cloudsyncDataSourceHelper(data: CloudSyncTaskUi[]): CloudSyncTaskUi[] {
    const cloudsyncData = data.map((task) => {
      const formattedCronSchedule = `${task.schedule.minute} ${task.schedule.hour} ${task.schedule.dom} ${task.schedule.month} ${task.schedule.dow}`;
      task.credential = task.credentials.name;
      task.cron_schedule = task.enabled ? formattedCronSchedule : this.translate.instant('Disabled');
      task.frequency = this.taskService.getTaskCronDescription(formattedCronSchedule);
      task.next_run = task.enabled ? this.taskService.getTaskNextRun(formattedCronSchedule) : this.translate.instant('Disabled');
      task.next_run_time = task.enabled ? this.taskService.getTaskNextTime(formattedCronSchedule) : this.translate.instant('Disabled');

      if (task.job === null) {
        task.state = { state: task.locked ? JobState.Locked : JobState.Pending };
      } else {
        task.state = { state: task.job.state };
        this.job.getJobStatus(task.job.id).pipe(
          untilDestroyed(this),
        ).subscribe((job: Job) => {
          task.state = { state: job.state };
          task.job = job;
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
        });
      }
      return task;
    });
  }

  smartTestsDataSourceHelper(data: SmartTestUi[]): SmartTestUi[] {
    return data.map((test) => {
      test.cron_schedule = `0 ${test.schedule.hour} ${test.schedule.dom} ${test.schedule.month} ${test.schedule.dow}`;
      test.frequency = this.taskService.getTaskCronDescription(test.cron_schedule);
      test.next_run = this.taskService.getTaskNextRun(test.cron_schedule);

      if (test.all_disks) {
        test.disks = [this.translate.instant(helptext_smart.smarttest_all_disks_placeholder)];
      } else if (test.disks.length) {
        test.disks = [
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
      task.next_run = this.taskService.getTaskNextRun(task.cron_schedule);

      return task;
    });
  }

  rsyncDataSourceHelper(data: RsyncTaskUi[]): RsyncTaskUi[] {
    return data.map((task) => {
      task.cron_schedule = `${task.schedule.minute} ${task.schedule.hour} ${task.schedule.dom} ${task.schedule.month} ${task.schedule.dow}`;
      task.frequency = this.taskService.getTaskCronDescription(task.cron_schedule);
      task.next_run = this.taskService.getTaskNextRun(task.cron_schedule);

      if (task.job === null) {
        task.state = { state: task.locked ? JobState.Locked : JobState.Pending };
      } else {
        task.state = { state: task.job.state };
        this.job.getJobStatus(task.job.id).pipe(
          untilDestroyed(this),
        ).subscribe((job: Job) => {
          task.state = { state: job.state };
          task.job = job;
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
                .subscribe(
                  (jobId: number) => {
                    this.dialog.info(
                      this.translate.instant('Task started'),
                      this.translate.instant('Replication <i>{name}</i> has started.', { name: row.name }),
                      '500px',
                      'info',
                      true,
                    );
                    this.job
                      .getJobStatus(jobId)
                      .pipe(untilDestroyed(this))
                      .subscribe((job: Job) => {
                        row.state = { state: job.state };
                        row.job = job;
                      });
                  },
                  (err) => {
                    new EntityUtils().handleWsError(this, err);
                  },
                );
            });
        },
      },
      {
        name: 'restore',
        matTooltip: this.translate.instant('Restore'),
        icon: 'restore',
        onClick: (row) => {
          const conf: DialogFormConfiguration = {
            title: helptext_replication.replication_restore_dialog.title,
            fieldConfig: [
              {
                type: 'input',
                name: 'name',
                placeholder: helptext_replication.name_placeholder,
                tooltip: helptext_replication.name_tooltip,
                validation: [Validators.required],
                required: true,
              },
              {
                type: 'explorer',
                explorerType: ExplorerType.Dataset,
                initial: '',
                name: 'target_dataset',
                placeholder: helptext_replication.target_dataset_placeholder,
                tooltip: helptext_replication.target_dataset_tooltip,
                validation: [Validators.required],
                required: true,
              },
            ],
            saveButtonText: helptext_replication.replication_restore_dialog.saveButton,
            customSubmit: (entityDialog: EntityDialogComponent) => {
              this.loader.open();
              this.ws
                .call('replication.restore', [row.id, entityDialog.formValue])
                .pipe(untilDestroyed(entityDialog))
                .subscribe(
                  () => {
                    entityDialog.dialogRef.close(true);
                    this.loader.close();
                    this.refreshTables();
                  },
                  (err) => {
                    this.loader.close();
                    new EntityUtils().handleWsError(entityDialog, err, this.dialog);
                  },
                );
            },
          };
          this.dialog.dialogFormWide(conf);
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
                .subscribe(
                  (jobId: number) => {
                    this.dialog.info(
                      this.translate.instant('Task Started'),
                      this.translate.instant('Cloud sync <i>{taskName}</i> has started.', { taskName: row.description }),
                      '500px',
                      'info',
                      true,
                    );
                    this.job
                      .getJobStatus(jobId)
                      .pipe(untilDestroyed(this))
                      .subscribe((job: Job) => {
                        row.state = { state: job.state };
                        row.job = job;
                      });
                  },
                  (err) => {
                    new EntityUtils().handleWsError(this, err);
                  },
                );
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
                .subscribe(
                  () => {
                    this.dialog.info(
                      this.translate.instant('Task Stopped'),
                      this.translate.instant('Cloud sync <i>{taskName}</i> stopped.', { taskName: row.description }),
                      '500px',
                      'info',
                      true,
                    );
                  },
                  (err) => {
                    new EntityUtils().handleWsError(this, err);
                  },
                );
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
                .subscribe(
                  (jobId: number) => {
                    this.dialog.info(
                      this.translate.instant('Task Started'),
                      this.translate.instant('Cloud sync <i>{taskName}</i> has started.', { taskName: row.description }),
                      '500px',
                      'info',
                      true,
                    );
                    this.job
                      .getJobStatus(jobId)
                      .pipe(untilDestroyed(this))
                      .subscribe((job: Job) => {
                        row.state = { state: job.state };
                        row.job = job;
                      });
                  },
                  (err) => {
                    new EntityUtils().handleWsError(this, err);
                  },
                );
            });
        },
      },
      {
        icon: 'restore',
        matTooltip: this.translate.instant('Restore'),
        name: 'restore',
        onClick: (row) => {
          const conf: DialogFormConfiguration = {
            title: this.translate.instant('Restore Cloud Sync Task'),
            fieldConfig: [
              {
                type: 'input',
                name: 'description',
                placeholder: helptext_cloudsync.description_placeholder,
                tooltip: helptext_cloudsync.description_tooltip,
                validation: helptext_cloudsync.description_validation,
                required: true,
              },
              {
                type: 'select',
                name: 'transfer_mode',
                placeholder: helptext_cloudsync.transfer_mode_placeholder,
                validation: helptext_cloudsync.transfer_mode_validation,
                required: true,
                options: [
                  { label: this.translate.instant('SYNC'), value: TransferMode.Sync },
                  { label: this.translate.instant('COPY'), value: TransferMode.Copy },
                ],
                value: TransferMode.Copy,
              },
              {
                type: 'paragraph',
                name: 'transfer_mode_warning',
                paraText: helptext_cloudsync.transfer_mode_warning_copy,
                isLargeText: true,
                paragraphIcon: 'add_to_photos',
              },
              {
                type: 'explorer',
                explorerType: ExplorerType.Directory,
                name: 'path',
                placeholder: helptext_cloudsync.path_placeholder,
                tooltip: helptext_cloudsync.path_tooltip,
                validation: helptext_cloudsync.path_validation,
                initial: '/mnt',
                required: true,
              },
            ],
            saveButtonText: 'Restore',
            afterInit(entityDialog: EntityDialogComponent) {
              entityDialog.formGroup
                .get('transfer_mode')
                .valueChanges.pipe(untilDestroyed(entityDialog))
                .subscribe((mode: TransferMode) => {
                  const paragraph = conf.fieldConfig.find((config) => {
                    return config.name === 'transfer_mode_warning';
                  }) as FormParagraphConfig;
                  switch (mode) {
                    case TransferMode.Sync:
                      paragraph.paraText = helptext_cloudsync.transfer_mode_warning_sync;
                      paragraph.paragraphIcon = 'sync';
                      break;
                    default:
                      paragraph.paraText = helptext_cloudsync.transfer_mode_warning_copy;
                      paragraph.paragraphIcon = 'add_to_photos';
                  }
                });
            },
            customSubmit: (entityDialog: EntityDialogComponent) => {
              this.loader.open();
              this.ws
                .call('cloudsync.restore', [row.id, entityDialog.formValue])
                .pipe(untilDestroyed(entityDialog))
                .subscribe(
                  () => {
                    entityDialog.dialogRef.close(true);
                    this.loader.close();
                    this.refreshTables();
                  },
                  (err) => {
                    this.loader.close();
                    new EntityUtils().handleWsError(entityDialog, err, this.dialog);
                  },
                );
            },
          };
          this.dialog.dialogFormWide(conf);
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
                .subscribe(
                  (jobId: number) => {
                    this.dialog.info(
                      this.translate.instant('Task Started'),
                      this.translate.instant('Rsync task <i>{ taskName }</i> started.', { taskName: `${row.remotehost} – ${row.remotemodule}` }),
                      '500px',
                      'info',
                      true,
                    );
                    this.job
                      .getJobStatus(jobId)
                      .pipe(untilDestroyed(this))
                      .subscribe((job: Job) => {
                        row.state = { state: job.state };
                        row.job = job;
                      });
                  },
                  (err) => {
                    new EntityUtils().handleWsError(this, err);
                  },
                );
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
      data: { title: this.translate.instant(helptext.task_is_running) },
    });
    dialogRef.componentInstance.jobId = jobId;
    dialogRef.componentInstance.wsshow();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      dialogRef.close();
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe(() => {
      dialogRef.close();
    });
  }

  stateButton(row: TaskTableRow): void {
    if (row.job) {
      if (row.job.state === JobState.Running) {
        this.runningStateButton(row.job.id);
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
      this.dialog.info(globalHelptext.noLogDilaog.title, globalHelptext.noLogDilaog.message);
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
      .subscribe(
        (updatedEntity) => {
          row[param] = updatedEntity[param];
        },
        (err) => {
          row[param] = !row[param];
          new EntityUtils().handleWsError(this, err, this.dialog);
        },
      );
  }
}
