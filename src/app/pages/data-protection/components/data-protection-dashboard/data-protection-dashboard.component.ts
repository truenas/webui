import { DatePipe } from '@angular/common';
import {
  ChangeDetectorRef, Component, OnDestroy, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';

import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import globalHelptext from 'app/helptext/global-helptext';
import helptext_cloudsync from 'app/helptext/data-protection/cloudsync/cloudsync-form';
import helptext_replication from 'app/helptext/data-protection/replication/replication';
import helptext_smart from 'app/helptext/data-protection/smart/smart';
import helptext from 'app/helptext/data-protection/data-protection-dashboard/data-protection-dashboard';
import {
  DialogService,
  ReplicationService,
  StorageService,
  TaskService,
  UserService,
  WebSocketService,
} from 'app/services';
import { T } from 'app/translate-marker';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { CloudCredentialService } from 'app/services/cloudcredential.service';
import { JobService } from 'app/services/job.service';
import { KeychainCredentialService } from 'app/services/keychaincredential.services';
import { ModalService } from 'app/services/modal.service';
import { EntityFormService } from 'app/pages/common/entity/entity-form/services/entity-form.service';
import { AppTableAction, InputTableConf } from 'app/pages/common/entity/table/table.component';
import { CloudsyncFormComponent } from 'app/pages/data-protection/cloudsync/cloudsync-form/cloudsync-form.component';
import { ReplicationFormComponent } from 'app/pages/data-protection/replication/replication-form/replication-form.component';
import { RsyncFormComponent } from 'app/pages/data-protection/rsync/rsync-form/rsync-form.component';
import { ScrubFormComponent } from 'app/pages/data-protection/scrub/scrub-form/scrub-form.component';
import { SmartFormComponent } from 'app/pages/data-protection/smart/smart-form/smart-form.component';
import { SnapshotFormComponent } from 'app/pages/data-protection/snapshot/snapshot-form/snapshot-form.component';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { ReplicationWizardComponent } from 'app/pages/data-protection/replication/replication-wizard/replication-wizard.component';
import { EntityJob } from 'app/interfaces/entity-job.interface';
import { EntityJobState } from 'app/enums/entity-job-state.enum';
import { PeriodicSnapshotTaskUi } from 'app/interfaces/periodic-snapshot-task.interface';
import { CloudSyncTaskUi } from 'app/interfaces/cloud-sync-task.interface';
import { ReplicationTaskUi } from 'app/interfaces/replication-task.interface';
import { ScrubTaskUi } from 'app/interfaces/scrub-task.interface';
import { RsyncTaskUi } from 'app/interfaces/rsync-task.interface';
import { SmartTestUi } from 'app/interfaces/smart-test.interface';
import { TransferMode } from 'app/enums/transfer-mode.enum';

export interface TaskCard {
  name: string;
  tableConf: InputTableConf;
}

@Component({
  selector: 'app-data-protection-dashboard',
  templateUrl: './data-protection-dashboard.component.html',
  providers: [
    DatePipe,
    TaskService,
    UserService,
    EntityFormService,
    KeychainCredentialService,
    CloudCredentialService,
    JobService,
    ReplicationService,
  ],
})
export class DataProtectionDashboardComponent implements OnInit, OnDestroy {
  dataCards: TaskCard[] = [];
  onDestroy$ = new Subject();
  disks: any[] = [];
  parent: DataProtectionDashboardComponent;

  // Components included in this dashboard
  protected scrubFormComponent: ScrubFormComponent;
  protected snapshotFormComponent: SnapshotFormComponent;
  protected replicationFormComponent: ReplicationFormComponent;
  protected replicationWizardComponent: ReplicationWizardComponent;
  protected cloudsyncFormComponent: CloudsyncFormComponent;
  protected rsyncFormComponent: RsyncFormComponent;
  protected smartFormComponent: SmartFormComponent;

  constructor(
    private ws: WebSocketService,
    private modalService: ModalService,
    private dialog: DialogService,
    private loader: AppLoaderService,
    public mdDialog: MatDialog,
    public datePipe: DatePipe,
    public router: Router,
    public aroute: ActivatedRoute,
    protected taskService: TaskService,
    protected userService: UserService,
    protected entityFormService: EntityFormService,
    protected storage: StorageService,
    protected keychainCredentialService: KeychainCredentialService,
    protected replicationService: ReplicationService,
    protected cloudCredentialService: CloudCredentialService,
    protected job: JobService,
    protected cdRef: ChangeDetectorRef,
    protected translate: TranslateService,
  ) {
    this.storage
      .listDisks()
      .pipe(takeUntil(this.onDestroy$))
      .subscribe((disks) => {
        if (disks) {
          this.disks = disks;
        }
      });
  }

  ngOnInit(): void {
    this.getCardData();

    this.refreshTables();
    this.modalService.refreshTable$.pipe(takeUntil(this.onDestroy$)).subscribe(() => {
      this.refreshTables();
    });
    this.modalService.onClose$.pipe(takeUntil(this.onDestroy$)).subscribe(() => {
      this.refreshTables();
    });

    this.refreshForms();
    this.modalService.refreshForm$.pipe(takeUntil(this.onDestroy$)).subscribe(() => {
      this.refreshForms();
    });

    this.modalService.message$.pipe(takeUntil(this.onDestroy$)).subscribe((res: any) => {
      if (res['action'] === 'open' && res['component'] === 'replicationForm') {
        this.modalService.open('slide-in-form', this.replicationFormComponent, res['row']);
      }
      if (res['action'] === 'open' && res['component'] === 'replicationWizard') {
        this.modalService.open('slide-in-form', this.replicationWizardComponent, res['row']);
      }
    });
  }

  getCardData(): void {
    this.dataCards = [
      {
        name: 'scrub',
        tableConf: {
          title: helptext.fieldset_scrub_tasks,
          titleHref: '/tasks/scrub',
          queryCall: 'pool.scrub.query',
          deleteCall: 'pool.scrub.delete',
          dataSourceHelper: this.scrubDataSourceHelper,
          emptyEntityLarge: false,
          columns: [
            { name: T('Pool'), prop: 'pool_name' },
            { name: T('Description'), prop: 'description' },
            { name: T('Schedule'), prop: 'frequency' },
            { name: T('Next Run'), prop: 'next_run', width: '80px' },
            { name: T('Enabled'), prop: 'enabled', width: '50px' },
          ],
          deleteMsg: {
            title: T('Scrub Task'),
            key_props: ['pool_name'],
          },
          parent: this,
          add() {
            this.parent.modalService.open('slide-in-form', this.parent.scrubFormComponent);
          },
          edit(row) {
            this.parent.modalService.open('slide-in-form', this.parent.scrubFormComponent, row.id);
          },
          tableActions: [
            {
              label: T('Adjust Priority'),
              onClick: () => {
                this.router.navigate(['/data-protection/scrub/priority']);
              },
            },
          ],
        },
      },
      {
        name: 'snapshot',
        tableConf: {
          title: helptext.fieldset_periodic_snapshot_tasks,
          titleHref: '/tasks/snapshot',
          queryCall: 'pool.snapshottask.query',
          deleteCall: 'pool.snapshottask.delete',
          deleteMsg: {
            title: T('Periodic Snapshot Task'),
            key_props: ['dataset', 'naming_schema', 'keepfor'],
          },
          columns: [
            { name: T('Pool/Dataset'), prop: 'dataset' },
            { name: T('Keep for'), prop: 'keepfor' },
            { name: T('Schedule'), prop: 'frequency' },
            { name: T('Next Run'), prop: 'next_run' },
            {
              name: T('Enabled'),
              prop: 'enabled',
              checkbox: true,
              width: '50px',
            },
            {
              name: T('State'),
              prop: 'state',
              state: 'state',
              button: true,
            },
          ],
          dataSourceHelper: this.snapshotDataSourceHelper,
          isActionVisible: this.isActionVisible,
          parent: this,
          add() {
            this.parent.modalService.open('slide-in-form', this.parent.snapshotFormComponent);
          },
          edit(row) {
            this.parent.modalService.open('slide-in-form', this.parent.snapshotFormComponent, row.id);
          },
          onButtonClick(row) {
            this.parent.stateButton(row);
          },
        },
      },
      {
        name: 'replication',
        tableConf: {
          title: helptext.fieldset_replication_tasks,
          titleHref: '/tasks/replication',
          queryCall: 'replication.query',
          deleteCall: 'replication.delete',
          deleteMsg: {
            title: T('Replication Task'),
            key_props: ['name'],
          },
          dataSourceHelper: this.replicationDataSourceHelper,
          getActions: this.getReplicationActions.bind(this),
          isActionVisible: this.isActionVisible,
          columns: [
            { name: T('Name'), prop: 'name' },
            { name: T('Last Snapshot'), prop: 'task_last_snapshot' },
            {
              name: T('Enabled'),
              prop: 'enabled',
              checkbox: true,
              width: '50px',
            },
            {
              name: T('State'),
              prop: 'state',
              button: true,
              state: 'state',
            },
          ],
          parent: this,
          add() {
            this.parent.modalService.open('slide-in-form', this.parent.replicationWizardComponent);
          },
          edit(row) {
            this.parent.modalService.open('slide-in-form', this.parent.replicationFormComponent, row.id);
          },
          onButtonClick(row) {
            this.parent.stateButton(row);
          },
        },
      },
      {
        name: 'cloudsync',
        tableConf: {
          title: helptext.fieldset_cloud_sync_tasks,
          titleHref: '/tasks/cloudsync',
          queryCall: 'cloudsync.query',
          deleteCall: 'cloudsync.delete',
          deleteMsg: {
            title: T('Cloud Sync Task'),
            key_props: ['description'],
          },
          dataSourceHelper: this.cloudsyncDataSourceHelper,
          getActions: this.getCloudsyncActions.bind(this),
          isActionVisible: this.isActionVisible,
          columns: [
            { name: T('Description'), prop: 'description' },
            { name: T('Schedule'), prop: 'frequency' },
            {
              name: T('Next Run'),
              prop: 'next_run',
              width: '80px',
            },
            { name: T('Enabled'), prop: 'enabled', width: '50px' },
            {
              name: T('State'),
              prop: 'state',
              state: 'state',
              button: true,
            },
          ],
          parent: this,
          add() {
            this.parent.modalService.open('slide-in-form', this.parent.cloudsyncFormComponent);
          },
          edit(row) {
            this.parent.modalService.open('slide-in-form', this.parent.cloudsyncFormComponent, row.id);
          },
          onButtonClick(row) {
            this.parent.stateButton(row);
          },
        },
      },
      {
        name: 'rsync',
        tableConf: {
          title: helptext.fieldset_rsync_tasks,
          titleHref: '/tasks/rsync',
          queryCall: 'rsynctask.query',
          deleteCall: 'rsynctask.delete',
          deleteMsg: {
            title: T('Rsync Task'),
            key_props: ['remotehost', 'remotemodule'],
          },
          columns: [
            { name: T('Path'), prop: 'path' },
            { name: T('Remote Host'), prop: 'remotehost' },
            { name: T('Schedule'), prop: 'frequency' },
            { name: T('Next Run'), prop: 'next_run' },
            { name: T('Enabled'), prop: 'enabled', width: '50px' },
            {
              name: T('State'),
              prop: 'state',
              state: 'state',
              button: true,
            },
          ],
          dataSourceHelper: this.rsyncDataSourceHelper,
          getActions: this.getRsyncActions.bind(this),
          isActionVisible: this.isActionVisible,
          parent: this,
          add() {
            this.parent.modalService.open('slide-in-form', this.parent.rsyncFormComponent);
          },
          edit(row) {
            this.parent.modalService.open('slide-in-form', this.parent.rsyncFormComponent, row.id);
          },
          onButtonClick(row) {
            this.parent.stateButton(row);
          },
        },
      },
      {
        name: 'smart',
        tableConf: {
          title: helptext.fieldset_smart_tests,
          titleHref: '/tasks/smart',
          queryCall: 'smart.test.query',
          deleteCall: 'smart.test.delete',
          deleteMsg: {
            title: T('S.M.A.R.T. Test'),
            key_props: ['type', 'desc'],
          },
          dataSourceHelper: this.smartTestsDataSourceHelper,
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
            { name: helptext_smart.smartlist_column_description, prop: 'desc' },
            {
              name: helptext_smart.smartlist_column_schedule,
              prop: 'frequency',
            },
            {
              name: helptext_smart.smartlist_column_next_run,
              prop: 'next_run',
            },
          ],
          add() {
            this.parent.modalService.open('slide-in-form', this.parent.smartFormComponent);
          },
          edit(row) {
            this.parent.modalService.open('slide-in-form', this.parent.smartFormComponent, row.id);
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

  refreshForms(): void {
    this.scrubFormComponent = new ScrubFormComponent(this.taskService, this.modalService);
    this.snapshotFormComponent = new SnapshotFormComponent(
      this.taskService,
      this.storage,
      this.dialog,
      this.modalService,
    );
    this.replicationWizardComponent = new ReplicationWizardComponent(
      this.keychainCredentialService,
      this.loader,
      this.dialog,
      this.ws,
      this.replicationService,
      this.datePipe,
      this.entityFormService,
      this.modalService,
    );
    this.replicationFormComponent = new ReplicationFormComponent(
      this.ws,
      this.taskService,
      this.storage,
      this.keychainCredentialService,
      this.replicationService,
      this.modalService,
    );
    this.cloudsyncFormComponent = new CloudsyncFormComponent(
      this.router,
      this.aroute,
      this.loader,
      this.dialog,
      this.mdDialog,
      this.ws,
      this.cloudCredentialService,
      this.job,
      this.modalService,
    );
    this.rsyncFormComponent = new RsyncFormComponent(
      this.router,
      this.aroute,
      this.taskService,
      this.userService,
      this.modalService,
    );
    this.smartFormComponent = new SmartFormComponent(this.ws, this.modalService);
  }

  scrubDataSourceHelper(data: ScrubTaskUi[]): ScrubTaskUi[] {
    return data.map((task) => {
      task.cron_schedule = `${task.schedule.minute} ${task.schedule.hour} ${task.schedule.dom} ${task.schedule.month} ${task.schedule.dow}`;
      task.frequency = this.parent.taskService.getTaskCronDescription(task.cron_schedule);
      task.next_run = this.parent.taskService.getTaskNextRun(task.cron_schedule);

      return task;
    });
  }

  cloudsyncDataSourceHelper(data: CloudSyncTaskUi[]): CloudSyncTaskUi[] {
    return data.map((task) => {
      task.credential = task.credentials.name;
      task.cron_schedule = `${task.schedule.minute} ${task.schedule.hour} ${task.schedule.dom} ${task.schedule.month} ${task.schedule.dow}`;
      task.frequency = this.parent.taskService.getTaskCronDescription(task.cron_schedule);
      task.next_run = this.parent.taskService.getTaskNextRun(task.cron_schedule);

      if (task.job === null) {
        task.state = { state: EntityJobState.Pending };
      } else {
        task.state = { state: task.job.state };
        this.parent.job.getJobStatus(task.job.id).subscribe((job: EntityJob) => {
          task.state = { state: job.state };
          task.job = job;
        });
      }

      return task;
    });
  }

  replicationDataSourceHelper(data: ReplicationTaskUi[]): ReplicationTaskUi[] {
    return data.map((task) => {
      task.task_last_snapshot = task.state.last_snapshot
        ? task.state.last_snapshot
        : this.parent.translate.instant(helptext.no_snapshot_sent_yet);

      if (task.job !== null) {
        task.state.state = task.job.state;
        this.parent.job.getJobStatus(task.job.id).subscribe((job: EntityJob) => {
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
      test.frequency = this.parent.taskService.getTaskCronDescription(test.cron_schedule);
      test.next_run = this.parent.taskService.getTaskNextRun(test.cron_schedule);

      if (test.all_disks) {
        test.disks = [this.parent.translate.instant(helptext_smart.smarttest_all_disks_placeholder)];
      } else if (test.disks.length) {
        test.disks = [test.disks
          .map((identifier: any) => {
            const fullDisk = this.parent.disks.find((item: any) => item.identifier === identifier);
            if (fullDisk) {
              identifier = fullDisk.devname;
            }
            return identifier;
          })
          .join(',')];
      }
      return test;
    });
  }

  snapshotDataSourceHelper(data: PeriodicSnapshotTaskUi[]): PeriodicSnapshotTaskUi[] {
    return data.map((task) => {
      task.keepfor = `${task.lifetime_value} ${task.lifetime_unit}(S)`;
      task.cron_schedule = `${task.schedule.minute} ${task.schedule.hour} ${task.schedule.dom} ${task.schedule.month} ${task.schedule.dow}`;
      task.frequency = this.parent.taskService.getTaskCronDescription(task.cron_schedule);
      task.next_run = this.parent.taskService.getTaskNextRun(task.cron_schedule);

      return task;
    });
  }

  rsyncDataSourceHelper(data: RsyncTaskUi[]): RsyncTaskUi[] {
    return data.map((task) => {
      task.cron_schedule = `${task.schedule.minute} ${task.schedule.hour} ${task.schedule.dom} ${task.schedule.month} ${task.schedule.dow}`;
      task.frequency = this.parent.taskService.getTaskCronDescription(task.cron_schedule);
      task.next_run = this.parent.taskService.getTaskNextRun(task.cron_schedule);

      if (task.job === null) {
        task.state = { state: EntityJobState.Pending };
      } else {
        task.state = { state: task.job.state };
        this.parent.job.getJobStatus(task.job.id).subscribe((job: EntityJob) => {
          task.state = { state: job.state };
          task.job = job;
        });
      }

      return task;
    });
  }

  getReplicationActions(): AppTableAction[] {
    return [
      {
        id: 'replication_run_now',
        icon: 'play_arrow',
        name: 'run',
        label: T('Run Now'),
        matTooltip: T('Run Now'),
        onClick: (row: any) => {
          this.dialog
            .confirm({
              title: this.translate.instant(T('Run Now')),
              message: this.translate.instant(T('Replicate <i>{name}</i> now?'), { name: row.name }),
              hideCheckBox: true,
            })
            .subscribe((res: boolean) => {
              if (res) {
                row.state = { state: EntityJobState.Running };
                this.ws.call('replication.run', [row.id]).subscribe(
                  (jobId: number) => {
                    this.dialog.Info(
                      T('Task started'),
                      T('Replication <i>') + row.name + T('</i> has started.'),
                      '500px',
                      'info',
                      true,
                    );
                    this.job.getJobStatus(jobId).subscribe((job: EntityJob) => {
                      row.state = { state: job.state };
                      row.job = job;
                    });
                  },
                  (err) => {
                    new EntityUtils().handleWSError(this, err);
                  },
                );
              }
            });
        },
      },
      {
        id: 'replication_restore',
        label: T('Restore'),
        matTooltip: T('Restore'),
        icon: 'restore',
        onClick: (row: any) => {
          const parent = this;
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
                explorerType: 'dataset',
                initial: '',
                name: 'target_dataset',
                placeholder: helptext_replication.target_dataset_placeholder,
                tooltip: helptext_replication.target_dataset_tooltip,
                validation: [Validators.required],
                required: true,
              },
            ],
            saveButtonText: helptext_replication.replication_restore_dialog.saveButton,
            customSubmit(entityDialog: EntityDialogComponent) {
              parent.loader.open();
              parent.ws.call('replication.restore', [row.id, entityDialog.formValue]).subscribe(
                () => {
                  entityDialog.dialogRef.close(true);
                  parent.loader.close();
                  parent.refreshTables();
                },
                (err) => {
                  parent.loader.close();
                  new EntityUtils().handleWSError(entityDialog, err, parent.dialog);
                },
              );
            },
          };
          this.dialog.dialogFormWide(conf);
        },
      },
    ] as unknown as AppTableAction[];
  }

  getCloudsyncActions(): AppTableAction[] {
    return [
      {
        id: 'cloudsync_run_now',
        label: T('Run Now'),
        icon: 'play_arrow',
        matTooltip: T('Run Now'),
        name: 'run',
        onClick: (row: any) => {
          this.dialog
            .confirm({
              title: T('Run Now'),
              message: T('Run this cloud sync now?'),
              hideCheckBox: true,
            })
            .subscribe((res: boolean) => {
              if (res) {
                row.state = { state: EntityJobState.Running };
                this.ws.call('cloudsync.sync', [row.id]).subscribe(
                  (jobId: number) => {
                    this.dialog.Info(
                      T('Task Started'),
                      T('Cloud sync <i>') + row.description + T('</i> has started.'),
                      '500px',
                      'info',
                      true,
                    );
                    this.job.getJobStatus(jobId).subscribe((job: EntityJob) => {
                      row.state = { state: job.state };
                      row.job = job;
                    });
                  },
                  (err) => {
                    new EntityUtils().handleWSError(this, err);
                  },
                );
              }
            });
        },
      },
      {
        id: 'cloudsync_stop',
        label: T('Stop'),
        icon: 'stop',
        matTooltip: T('Stop'),
        name: 'stop',
        onClick: (row: any) => {
          this.dialog
            .confirm({
              title: T('Stop'),
              message: T('Stop this cloud sync?'),
              hideCheckBox: true,
            })
            .subscribe((res: boolean) => {
              if (res) {
                this.ws.call('cloudsync.abort', [row.id]).subscribe(
                  () => {
                    this.dialog.Info(
                      T('Task Stopped'),
                      T('Cloud sync <i>') + row.description + T('</i> stopped.'),
                      '500px',
                      'info',
                      true,
                    );
                  },
                  (err) => {
                    new EntityUtils().handleWSError(this, err);
                  },
                );
              }
            });
        },
      },
      {
        id: 'cloudsync_dry_run',
        label: helptext_cloudsync.action_button_dry_run,
        icon: 'sync',
        matTooltip: helptext_cloudsync.action_button_dry_run,
        name: 'dry_run',
        onClick: (row: any) => {
          this.dialog
            .confirm({
              title: helptext_cloudsync.dry_run_title,
              message: helptext_cloudsync.dry_run_dialog,
              hideCheckBox: true,
            })
            .subscribe((res: boolean) => {
              if (res) {
                this.ws.call('cloudsync.sync', [row.id, { dry_run: true }]).subscribe(
                  (jobId: number) => {
                    this.dialog.Info(
                      T('Task Started'),
                      T('Cloud sync <i>') + row.description + T('</i> has started.'),
                      '500px',
                      'info',
                      true,
                    );
                    this.job.getJobStatus(jobId).subscribe((job: EntityJob) => {
                      row.state = { state: job.state };
                      row.job = job;
                    });
                  },
                  (err) => {
                    new EntityUtils().handleWSError(this, err);
                  },
                );
              }
            });
        },
      },
      {
        id: 'cloudsync_restore',
        label: T('Restore'),
        icon: 'restore',
        matTooltip: T('Restore'),
        name: 'restore',
        onClick: (row: any) => {
          const parent = this;
          const conf: DialogFormConfiguration = {
            title: T('Restore Cloud Sync Task'),
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
                  { label: T('SYNC'), value: TransferMode.Sync },
                  { label: T('COPY'), value: TransferMode.Copy },
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
                explorerType: 'directory',
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
              entityDialog.formGroup.get('transfer_mode').valueChanges.subscribe((mode: any) => {
                const paragraph = conf.fieldConfig.find((config) => config.name === 'transfer_mode_warning');
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
            customSubmit(entityDialog: EntityDialogComponent) {
              parent.loader.open();
              parent.ws.call('cloudsync.restore', [row.id, entityDialog.formValue]).subscribe(
                () => {
                  entityDialog.dialogRef.close(true);
                  parent.loader.close();
                  parent.refreshTables();
                },
                (err) => {
                  parent.loader.close();
                  new EntityUtils().handleWSError(entityDialog, err, parent.dialog);
                },
              );
            },
          };
          this.dialog.dialogFormWide(conf);
        },
      },
    ] as unknown as AppTableAction[];
  }

  getRsyncActions(): AppTableAction[] {
    return [
      {
        id: 'rsync_run_now',
        icon: 'play_arrow',
        label: T('Run Now'),
        matTooltip: T('Run Now'),
        name: 'run',
        onClick: (row: any) => {
          this.dialog
            .confirm({
              title: T('Run Now'),
              message: T('Run this rsync now?'),
              hideCheckBox: true,
            })
            .subscribe((run: boolean) => {
              if (run) {
                row.state = { state: EntityJobState.Running };
                this.ws.call('rsynctask.run', [row.id]).subscribe(
                  (jobId: number) => {
                    this.dialog.Info(
                      T('Task Started'),
                      'Rsync task <i>' + row.remotehost + ' - ' + row.remotemodule + '</i> started.',
                      '500px',
                      'info',
                      true,
                    );
                    this.job.getJobStatus(jobId).subscribe((job: EntityJob) => {
                      row.state = { state: job.state };
                      row.job = job;
                    });
                  },
                  (err) => {
                    new EntityUtils().handleWSError(this, err);
                  },
                );
              }
            });
        },
      },
    ] as unknown as AppTableAction[];
  }

  isActionVisible(name: string, row: any): boolean {
    if (name === 'run' && row.job && row.job.state === EntityJobState.Running) {
      return false;
    }
    if (name === 'stop' && (row.job ? row.job && row.job.state !== EntityJobState.Running : true)) {
      return false;
    }
    return true;
  }

  runningStateButton(jobId: number): void {
    const dialogRef = this.mdDialog.open(EntityJobComponent, {
      data: { title: this.translate.instant(helptext.task_is_running) },
      disableClose: false,
    });
    dialogRef.componentInstance.jobId = jobId;
    dialogRef.componentInstance.wsshow();
    dialogRef.componentInstance.success.subscribe(() => {
      dialogRef.close();
    });
    dialogRef.componentInstance.failure.subscribe(() => {
      dialogRef.close();
    });
  }

  stateButton(row: any): void {
    if (row.job) {
      if (row.job.state === EntityJobState.Running) {
        this.runningStateButton(row.job.id);
      } else {
        this.job.showLogs(row.job);
      }
    } else {
      this.dialog.Info(globalHelptext.noLogDilaog.title, globalHelptext.noLogDilaog.message);
    }
  }

  ngOnDestroy(): void {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }
}
