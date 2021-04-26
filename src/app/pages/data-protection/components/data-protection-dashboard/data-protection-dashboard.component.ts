import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import globalHelptext from 'app/helptext/global-helptext';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { T } from 'app/translate-marker';
import * as cronParser from 'cron-parser';
import { Moment } from 'moment';
import { Subscription } from 'rxjs';
import helptext_cloudsync from '../../../../helptext/data-protection/cloudsync/cloudsync-form';
import helptext_replication from '../../../../helptext/data-protection/replication/replication';
import helptext_smart from '../../../../helptext/data-protection/smart/smart';
import helptext from '../../../../helptext/data-protection/data-protection-dashboard/data-protection-dashboard';
import {
  DialogService,
  ReplicationService,
  StorageService,
  TaskService,
  UserService,
  WebSocketService,
} from '../../../../services';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { CloudCredentialService } from '../../../../services/cloudcredential.service';
import { JobService } from '../../../../services/job.service';
import { KeychainCredentialService } from '../../../../services/keychaincredential.services';
import { ModalService } from '../../../../services/modal.service';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';
import { InputTableConf } from '../../../common/entity/table/table.component';
import { CloudsyncFormComponent } from '../../cloudsync/cloudsync-form/cloudsync-form.component';
import { ReplicationFormComponent } from '../../replication/replication-form/replication-form.component';
import { RsyncFormComponent } from '../../rsync/rsync-form/rsync-form.component';
import { ScrubFormComponent } from '../../scrub/scrub-form/scrub-form.component';
import { SmartFormComponent } from '../../smart/smart-form/smart-form.component';
import { SnapshotFormComponent } from '../../snapshot/snapshot-form/snapshot-form.component';

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
  public dataCards: TaskCard[] = [];
  public configData: any;
  public entityForm: any;
  public refreshForm: Subscription;
  public refreshTable: Subscription;
  public refreshOnClose: Subscription;
  public diskSubscription: Subscription;
  public disks: any[] = [];
  public parent: any;

  // Components included in this dashboard
  protected scrubFormComponent: ScrubFormComponent;
  protected snapshotFormComponent: SnapshotFormComponent;
  protected replicationFormComponent: ReplicationFormComponent;
  protected cloudsyncFormComponent: CloudsyncFormComponent;
  protected rsyncFormComponent: RsyncFormComponent;
  protected smartFormComponent: SmartFormComponent;

  constructor(
    private ws: WebSocketService,
    private modalService: ModalService,
    private dialog: DialogService,
    private loader: AppLoaderService,
    private http: HttpClient,
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
  ) {
    this.diskSubscription = this.storage.listDisks().subscribe((disks) => {
      if (disks) {
        this.disks = disks;
      }
    });
  }

  ngOnInit(): void {
    this.getCardData();

    this.refreshTables();
    this.refreshTable = this.modalService.refreshTable$.subscribe(() => {
      this.refreshTables();
    });
    this.refreshOnClose = this.modalService.onClose$.subscribe(() => {
      this.refreshTables();
    });

    this.refreshForms();
    this.refreshForm = this.modalService.refreshForm$.subscribe(() => {
      this.refreshForms();
    });
  }

  getCardData() {
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
            { name: T('Next Run'), prop: 'scrub_next_run', width: '80px' },
            { name: T('Enabled'), prop: 'enabled', width: '50px' },
          ],
          deleteMsg: {
            title: T('Scrub Task'),
            key_props: ['pool_name'],
          },
          parent: this,
          add: function () {
            this.parent.modalService.open('slide-in-form', this.parent.scrubFormComponent);
          },
          edit: function (row) {
            this.parent.modalService.open('slide-in-form', this.parent.scrubFormComponent, row.id);
          },
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
            title: 'Periodic Snapshot Task',
            key_props: ['dataset', 'naming_schema', 'keepfor'],
          },
          columns: [
            { name: T('Pool/Dataset'), prop: 'dataset' },
            { name: T('Recursive'), prop: 'recursive' },
            { name: T('Keep for'), prop: 'keepfor' },
            { name: T('Enabled'), prop: 'enabled', checkbox: true, width: '50px' },
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
          add: function () {
            this.parent.modalService.open('slide-in-form', this.parent.snapshotFormComponent);
          },
          edit: function (row) {
            this.parent.modalService.open('slide-in-form', this.parent.snapshotFormComponent, row.id);
          },
          onButtonClick: function (row) {
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
            title: 'Replication Task',
            key_props: ['name'],
          },
          dataSourceHelper: this.replicationDataSourceHelper,
          getActions: this.getReplicationActions.bind(this),
          isActionVisible: this.isActionVisible,
          columns: [
            { name: T('Name'), prop: 'name' },
            { name: T('Enabled'), prop: 'enabled', checkbox: true, width: '50px' },
            { name: T('Last Snapshot'), prop: 'task_last_snapshot' },
            {
              name: T('State'),
              prop: 'state',
              button: true,
              state: 'state',
            },
          ],
          parent: this,
          add: function () {
            this.parent.modalService.open('slide-in-form', this.parent.replicationFormComponent);
          },
          edit: function (row) {
            this.parent.modalService.open('slide-in-form', this.parent.replicationFormComponent, row.id);
          },
          onButtonClick: function (row) {
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
            title: 'Cloud Sync Task',
            key_props: ['description'],
          },
          dataSourceHelper: this.cloudsyncDataSourceHelper,
          getActions: this.getCloudsyncActions.bind(this),
          isActionVisible: this.isActionVisible,
          columns: [
            {
              name: T('Description'),
              prop: 'description',
              always_display: true,
            },
            { name: T('Next Run'), prop: 'next_run', hidden: true, width: '80px' },
            { name: T('Enabled'), prop: 'enabled', width: '50px' },
            {
              name: T('State'),
              prop: 'state',
              state: 'state',
              infoStates: ['NOT RUN SINCE LAST BOOT'],
              button: true,
            },
          ],
          parent: this,
          add: function () {
            this.parent.modalService.open('slide-in-form', this.parent.cloudsyncFormComponent);
          },
          edit: function (row) {
            this.parent.modalService.open('slide-in-form', this.parent.cloudsyncFormComponent, row.id);
          },
          onButtonClick: function (row) {
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
            title: 'Rsync Task',
            key_props: ['remotehost', 'remotemodule'],
          },
          columns: [
            { name: T('Path'), prop: 'path' },
            { name: T('Remote Host'), prop: 'remotehost' },
            { name: T('Enabled'), prop: 'enabled', width: '50px' },
            { name: T('State'), prop: 'state', state: 'state', button: true },
          ],
          dataSourceHelper: this.rsyncDataSourceHelper,
          getActions: this.getRsyncActions.bind(this),
          isActionVisible: this.isActionVisible,
          parent: this,
          add: function () {
            this.parent.modalService.open('slide-in-form', this.parent.rsyncFormComponent);
          },
          edit: function (row) {
            this.parent.modalService.open('slide-in-form', this.parent.rsyncFormComponent, row.id);
          },
          onButtonClick: function (row) {
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
            title: 'S.M.A.R.T. Test',
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
              prop: 'schedule',
            },
          ],
          add: function () {
            this.parent.modalService.open('slide-in-form', this.parent.smartFormComponent);
          },
          edit: function (row) {
            this.parent.modalService.open('slide-in-form', this.parent.smartFormComponent, row.id);
          },
        },
      },
    ];
  }

  refreshTables() {
    this.dataCards.forEach((card) => {
      if (card.tableConf.tableComponent) {
        card.tableConf.tableComponent.getData();
      }
    });
  }

  refreshForms() {
    this.scrubFormComponent = new ScrubFormComponent(this.taskService, this.modalService);
    this.snapshotFormComponent = new SnapshotFormComponent(
      this.taskService,
      this.storage,
      this.dialog,
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

  scrubDataSourceHelper(data: any[]) {
    return data.map((task) => {
      task.schedule = `${task.schedule.minute} ${task.schedule.hour} ${task.schedule.dom} ${task.schedule.month} ${task.schedule.dow}`;

      /* Weird type assertions are due to a type definition error in the cron-parser library */
      task.scrub_next_run = ((cronParser
        .parseExpression(task.schedule, {
          iterator: true,
        })
        .next() as unknown) as {
        value: { _date: Moment };
      }).value._date.fromNow();

      return task;
    });
  }

  cloudsyncDataSourceHelper(data: any[]) {
    return data.map((task) => {
      task.minute = task.schedule['minute'];
      task.hour = task.schedule['hour'];
      task.dom = task.schedule['dom'];
      task.month = task.schedule['month'];
      task.dow = task.schedule['dow'];
      task.credential = task.credentials['name'];

      task.cron = `${task.minute} ${task.hour} ${task.dom} ${task.month} ${task.dow}`;

      /* Weird type assertions are due to a type definition error in the cron-parser library */
      task.next_run = ((cronParser.parseExpression(task.cron, { iterator: true }).next() as unknown) as {
        value: { _date: Moment };
      }).value._date.fromNow();

      if (task.job == null) {
        task.state = T('NOT RUN SINCE LAST BOOT');
      } else {
        task.state = task.job.state;
      }

      return task;
    });
  }

  replicationDataSourceHelper(data: any[]) {
    return data.map((task) => {
      task.state = task.state.state;
      task.ssh_connection = task.ssh_credentials ? task.ssh_credentials.name : '-';
      task.task_last_snapshot = task.state.last_snapshot ? task.state.last_snapshot : T('No snapshots sent yet');
      return task;
    });
  }

  smartTestsDataSourceHelper(data: any[]) {
    return data.map((test) => {
      test.schedule = `${test.schedule.hour} ${test.schedule.dom} ${test.schedule.month} ${test.schedule.dow}`;
      if (test.all_disks) {
        test.disks = [T('All Disks')];
      } else if (test.disks.length) {
        test.disks = test.disks
          .map((identifier: any) => {
            const fullDisk = this.parent.disks.find((item: any) => item.identifier === identifier);
            if (fullDisk) {
              identifier = fullDisk.devname;
            }
            return identifier;
          })
          .join(',');
      }
      return test;
    });
  }

  snapshotDataSourceHelper(data: any[]) {
    return data.map((task) => {
      task.state = task.state.state;
      task.keepfor = `${task.lifetime_value} ${task.lifetime_unit}(S)`;

      return task;
    });
  }

  rsyncDataSourceHelper(data: any[]) {
    return data.map((task) => {
      task.minute = task.schedule['minute'];
      task.hour = task.schedule['hour'];
      task.dom = task.schedule['dom'];
      task.month = task.schedule['month'];
      task.dow = task.schedule['dow'];

      task.cron = `${task.minute} ${task.hour} ${task.dom} ${task.month} ${task.dow}`;

      if (task.job == null) {
        task.state = T('PENDING');
      } else {
        task.state = task.job.state;
        this.parent.job.getJobStatus(task.job.id).subscribe((t: any) => {
          task.state = t.job ? t.job.state : null;
        });
      }

      return task;
    });
  }

  getReplicationActions() {
    return [
      {
        id: 'replication_run_now',
        icon: 'play_arrow',
        name: 'run',
        label: T('Run Now'),
        matTooltip: T('Run Now'),
        onClick: (row: any) => {
          this.dialog.confirm(T('Run Now'), T('Replicate <i>') + row.name + T('</i> now?'), true).subscribe((res: boolean) => {
            if (res) {
              row.state = 'RUNNING';
              this.ws.call('replication.run', [row.id]).subscribe(
                (jobId) => {
                  this.dialog.Info(
                    T('Task started'),
                    T('Replication <i>') + row.name + T('</i> has started.'),
                    '500px',
                    'info',
                    true,
                  );
                  this.job.getJobStatus(jobId).subscribe((task) => {
                    row.state = task.state;
                    row.job = task;
                  });
                },
                (err) => {
                  new EntityUtils().handleWSError(this.entityForm, err);
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
            customSubmit: function (entityDialog: EntityDialogComponent) {
              parent.loader.open();
              parent.ws.call('replication.restore', [row.id, entityDialog.formValue]).subscribe(
                (res) => {
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
    ];
  }

  getCloudsyncActions() {
    return [
      {
        id: 'cloudsync_run_now',
        label: T('Run Now'),
        icon: 'play_arrow',
        matTooltip: T('Run Now'),
        name: 'run',
        onClick: (row: any) => {
          this.dialog.confirm(T('Run Now'), T('Run this cloud sync now?'), true).subscribe((res: boolean) => {
            if (res) {
              row.state = 'RUNNING';
              this.ws.call('cloudsync.sync', [row.id]).subscribe(
                (res: any) => {
                  this.dialog.Info(
                    T('Task Started'),
                    T('Cloud sync <i>') + row.description + T('</i> has started.'),
                    '500px',
                    'info',
                    true,
                  );
                  this.job.getJobStatus(res).subscribe((task) => {
                    row.state = task.state;
                    row.job = task;
                  });
                },
                (err) => {
                  new EntityUtils().handleWSError(this.entityForm, err);
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
          this.dialog.confirm(T('Stop'), T('Stop this cloud sync?'), true).subscribe((res: any) => {
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
                (wsErr) => {
                  new EntityUtils().handleWSError(this.entityForm, wsErr);
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
            .confirm(helptext_cloudsync.dry_run_title, helptext_cloudsync.dry_run_dialog, true)
            .subscribe((dialog_res: any) => {
              if (dialog_res) {
                this.ws.call('cloudsync.sync', [row.id, { dry_run: true }]).subscribe(
                  (res) => {
                    this.dialog.Info(
                      T('Task Started'),
                      T('Cloud sync <i>') + row.description + T('</i> has started.'),
                      '500px',
                      'info',
                      true,
                    );
                    this.job.getJobStatus(res).subscribe((task) => {
                      row.state = task.state;
                      row.job = task;
                    });
                  },
                  (err) => {
                    new EntityUtils().handleWSError(this.entityForm, err);
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
                  { label: 'SYNC', value: 'SYNC' },
                  { label: 'COPY', value: 'COPY' },
                ],
                value: 'COPY',
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
            afterInit: function (entityDialog: EntityDialogComponent) {
              entityDialog.formGroup.get('transfer_mode').valueChanges.subscribe((mode) => {
                const paragraph = conf.fieldConfig.find((config) => config.name === 'transfer_mode_warning');
                switch (mode) {
                  case 'SYNC':
                    paragraph.paraText = helptext_cloudsync.transfer_mode_warning_sync;
                    paragraph.paragraphIcon = 'sync';
                    break;
                  default:
                    paragraph.paraText = helptext_cloudsync.transfer_mode_warning_copy;
                    paragraph.paragraphIcon = 'add_to_photos';
                }
              });
            },
            customSubmit: function (entityDialog: EntityDialogComponent) {
              parent.loader.open();
              parent.ws.call('cloudsync.restore', [row.id, entityDialog.formValue]).subscribe(
                (res) => {
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
    ];
  }

  getRsyncActions() {
    return [
      {
        id: 'rsync_run_now',
        icon: 'play_arrow',
        label: T('Run Now'),
        matTooltip: T('Run Now'),
        name: 'run',
        onClick: (row: any) => {
          this.dialog.confirm(T('Run Now'), T('Run this rsync now?'), true).subscribe((run: boolean) => {
            if (run) {
              row.state = 'RUNNING';
              this.ws.call('rsynctask.run', [row.id]).subscribe(
                (res) => {
                  this.dialog.Info(
                    T('Task Started'),
                    'Rsync task <i>' + row.remotehost + ' - ' + row.remotemodule + '</i> started.',
                    '500px',
                    'info',
                    true,
                  );
                  this.job.getJobStatus(res).subscribe((task) => {
                    row.state = task.state;
                    row.job = task;
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
    ];
  }

  isActionVisible(name: string, row: any) {
    if (name === 'run' && row.job && row.state === 'RUNNING') {
      return false;
    } else if (name === 'stop' && (row.job ? row.job && row.state !== 'RUNNING' : true)) {
      return false;
    }
    return true;
  }

  stateButton(row: any) {
    if (row.state === 'RUNNING') {
      // this.runningStateButton(row.job.id)
    } else if (row.state === 'HOLD') {
      this.dialog.Info(T('Task is on hold'), row.state.reason, '500px', 'info', true);
    } else {
      const error = row.job && row.state === 'ERROR' ? row.job.error : null;
      const log = row.job && row.job.logs_excerpt ? row.job.logs_excerpt : null;
      if (error === null && log === null) {
        this.dialog.Info(globalHelptext.noLogDilaog.title, globalHelptext.noLogDilaog.message, '500px', 'info', true);
      }

      const dialog_title = T('Task State');
      const dialog_content =
        (error ? `<h5>${T('Error')}</h5> <pre>${error}</pre>` : '') +
        (log ? `<h5>${T('Logs')}</h5> <pre>${log}</pre>` : '');

      if (log) {
        this.dialog
          .confirm(
            dialog_title,
            dialog_content,
            true,
            T('Download Logs'),
            false,
            '',
            '',
            '',
            '',
            false,
            T('Cancel'),
            true,
          )
          .subscribe((dialog_res: any) => {
            if (dialog_res) {
              const filename = `${row.job.id}.log`;
              this.ws.call('core.download', ['filesystem.get', [row.job.logs_path], filename]).subscribe(
                (res) => {
                  const url = res[1];
                  const mimetype = 'text/plain';
                  this.storage.streamDownloadFile(this.http, url, filename, mimetype).subscribe(
                    (blob) => this.storage.downloadBlob(blob, filename),
                    (err) => new EntityUtils().handleWSError(this, err),
                  );
                },
                (err) => new EntityUtils().handleWSError(this, err),
              );
            }
          });
      }
    }
  }

  ngOnDestroy() {
    this.refreshForm.unsubscribe();
    this.refreshTable.unsubscribe();
    this.diskSubscription.unsubscribe();
    this.refreshOnClose.unsubscribe();
  }
}
