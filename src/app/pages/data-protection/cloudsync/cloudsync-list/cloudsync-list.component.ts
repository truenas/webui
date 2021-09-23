import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { JobState } from 'app/enums/job-state.enum';
import { TransferMode } from 'app/enums/transfer-mode.enum';
import helptext from 'app/helptext/data-protection/cloudsync/cloudsync-form';
import globalHelptext from 'app/helptext/global-helptext';
import { CloudSyncTask, CloudSyncTaskUi } from 'app/interfaces/cloud-sync-task.interface';
import { Job } from 'app/interfaces/job.interface';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { FormParagraphConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import {
  EntityTableComponent,
} from 'app/pages/common/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { CloudsyncFormComponent } from 'app/pages/data-protection/cloudsync/cloudsync-form/cloudsync-form.component';
import {
  AppLoaderService,
  CloudCredentialService,
  DialogService,
  JobService,
  TaskService,
  WebSocketService,
} from 'app/services';
import { ModalService } from 'app/services/modal.service';
import { T } from 'app/translate-marker';

@UntilDestroy()
@Component({
  selector: 'app-cloudsync-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
  providers: [JobService, TaskService, CloudCredentialService],
})
export class CloudsyncListComponent implements EntityTableConfig<CloudSyncTaskUi> {
  title = T('Cloud Sync Tasks');
  queryCall: 'cloudsync.query' = 'cloudsync.query';
  route_add: string[] = ['tasks', 'cloudsync', 'add'];
  route_add_tooltip = 'Add Cloud Sync Task';
  route_edit: string[] = ['tasks', 'cloudsync', 'edit'];
  wsDelete: 'cloudsync.delete' = 'cloudsync.delete';
  entityList: EntityTableComponent;
  asyncView = true;

  columns = [
    { name: T('Description'), prop: 'description', always_display: true },
    { name: T('Credential'), prop: 'credential', hidden: true },
    { name: T('Direction'), prop: 'direction', hidden: true },
    { name: T('Transfer Mode'), prop: 'transfer_mode', hidden: true },
    { name: T('Path'), prop: 'path', hidden: true },
    {
      name: T('Schedule'),
      prop: 'cron_schedule',
      hidden: true,
      widget: {
        icon: 'calendar-range',
        component: 'TaskScheduleListComponent',
      },
    },
    { name: T('Frequency'), prop: 'frequency', enableMatTooltip: true },
    { name: T('Next Run'), prop: 'next_run', hidden: true },
    {
      name: T('Status'),
      prop: 'state',
      state: 'state',
      button: true,
    },
    { name: T('Enabled'), prop: 'enabled' },
  ];
  rowIdentifier = 'description';
  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: T('Cloud Sync Task'),
      key_props: ['description'],
    },
  };

  constructor(
    protected ws: WebSocketService,
    protected translate: TranslateService,
    protected dialog: DialogService,
    protected job: JobService,
    protected modalService: ModalService,
    protected loader: AppLoaderService,
    protected taskService: TaskService,
  ) {}

  afterInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;
    this.modalService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      this.entityList.getData();
    });
  }

  resourceTransformIncomingRestData(data: CloudSyncTask[]): CloudSyncTaskUi[] {
    return data.map((task) => {
      const transformed = { ...task } as CloudSyncTaskUi;
      transformed.credential = task.credentials.name;
      transformed.cron_schedule = `${task.schedule.minute} ${task.schedule.hour} ${task.schedule.dom} ${task.schedule.month} ${task.schedule.dow}`;
      transformed.frequency = this.taskService.getTaskCronDescription(transformed.cron_schedule);
      transformed.next_run = this.taskService.getTaskNextRun(transformed.cron_schedule);

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
        label: T('Run Now'),
        icon: 'play_arrow',
        name: 'run',
        onClick: (row: CloudSyncTaskUi) => {
          this.dialog
            .confirm({ title: T('Run Now'), message: T('Run this cloud sync now?'), hideCheckBox: true })
            .pipe(untilDestroyed(this)).subscribe((res: boolean) => {
              if (res) {
                row.state = { state: JobState.Running };
                this.ws.call('cloudsync.sync', [row.id]).pipe(untilDestroyed(this)).subscribe(
                  (jobId: number) => {
                    this.dialog.info(
                      T('Task Started'),
                      this.translate.instant('Cloud sync <i>{taskName}</i> has started.', { taskName: row.description }),
                      '500px',
                      'info',
                      true,
                    );
                    this.job.getJobStatus(jobId).pipe(untilDestroyed(this)).subscribe((job: Job) => {
                      row.state = { state: job.state };
                      row.job = job;
                    });
                  },
                  (err) => {
                    new EntityUtils().handleWSError(this.entityList, err);
                  },
                );
              }
            });
        },
      },
      {
        actionName: parentrow.description,
        id: 'stop',
        name: 'stop',
        label: T('Stop'),
        icon: 'stop',
        onClick: (row: CloudSyncTaskUi) => {
          this.dialog
            .confirm({
              title: T('Stop'),
              message: T('Stop this cloud sync?'),
              hideCheckBox: true,
            })
            .pipe(untilDestroyed(this)).subscribe((res: boolean) => {
              if (res) {
                this.ws.call('cloudsync.abort', [row.id]).pipe(untilDestroyed(this)).subscribe(
                  () => {
                    this.dialog.info(
                      T('Task Stopped'),
                      this.translate.instant('Cloud sync <i>{taskName}</i> stopped.', { taskName: row.description }),
                      '500px',
                      'info',
                      true,
                    );
                  },
                  (wsErr) => {
                    new EntityUtils().handleWSError(this.entityList, wsErr);
                  },
                );
              }
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
            .pipe(untilDestroyed(this)).subscribe((res: boolean) => {
              if (res) {
                this.ws.call('cloudsync.sync', [row.id, { dry_run: true }]).pipe(untilDestroyed(this)).subscribe(
                  (jobId: number) => {
                    this.dialog.info(
                      T('Task Started'),
                      this.translate.instant('Cloud sync <i>{taskName}</i> has started.', { taskName: row.description }),
                      '500px',
                      'info',
                      true,
                    );
                    this.job.getJobStatus(jobId).pipe(untilDestroyed(this)).subscribe((job: Job) => {
                      row.state = { state: job.state };
                      row.job = job;
                    });
                  },
                  (err) => {
                    new EntityUtils().handleWSError(this.entityList, err);
                  },
                );
              }
            });
        },
      },
      {
        actionName: parentrow.description,
        id: 'restore',
        name: 'restore',
        label: T('Restore'),
        icon: 'restore',
        onClick: (row: CloudSyncTaskUi) => {
          const conf: DialogFormConfiguration = {
            title: T('Restore Cloud Sync Task'),
            fieldConfig: [
              {
                type: 'input',
                name: 'description',
                placeholder: helptext.description_placeholder,
                tooltip: helptext.description_tooltip,
                validation: helptext.description_validation,
                required: true,
              },
              {
                type: 'select',
                name: 'transfer_mode',
                placeholder: helptext.transfer_mode_placeholder,
                validation: helptext.transfer_mode_validation,
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
                paraText: helptext.transfer_mode_warning_copy,
                isLargeText: true,
                paragraphIcon: 'add_to_photos',
              },
              {
                type: 'explorer',
                explorerType: 'directory',
                name: 'path',
                placeholder: helptext.path_placeholder,
                tooltip: helptext.path_tooltip,
                validation: helptext.path_validation,
                initial: '/mnt',
                required: true,
              },
            ],
            saveButtonText: T('Restore'),
            afterInit(entityDialog: EntityDialogComponent) {
              entityDialog.formGroup.get('transfer_mode').valueChanges.pipe(untilDestroyed(this)).subscribe((mode) => {
                const paragraph: FormParagraphConfig = conf.fieldConfig.find((config) => config.name === 'transfer_mode_warning');
                switch (mode) {
                  case TransferMode.Sync:
                    paragraph.paraText = helptext.transfer_mode_warning_sync;
                    paragraph.paragraphIcon = 'sync';
                    break;
                  default:
                    paragraph.paraText = helptext.transfer_mode_warning_copy;
                    paragraph.paragraphIcon = 'add_to_photos';
                }
              });
            },
            customSubmit: (entityDialog: EntityDialogComponent) => {
              this.loader.open();
              this.ws.call('cloudsync.restore', [row.id, entityDialog.formValue]).pipe(untilDestroyed(this)).subscribe(
                () => {
                  entityDialog.dialogRef.close(true);
                  this.entityList.getData();
                },
                (err) => {
                  this.loader.close();
                  new EntityUtils().handleWSError(entityDialog, err, this.dialog);
                },
              );
            },
          };
          this.dialog.dialogFormWide(conf);
        },
      },
      {
        id: 'edit',
        actionName: parentrow.description,
        name: 'edit',
        icon: 'edit',
        label: T('Edit'),
        onClick: (row: CloudSyncTaskUi) => {
          this.doEdit(row.id);
        },
      },
      {
        actionName: parentrow.description,
        id: 'delete',
        name: 'delete',
        label: T('Delete'),
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
        this.entityList.runningStateButton(row.job.id);
      } else {
        this.job.showLogs(row.job);
      }
    } else {
      this.dialog.info(globalHelptext.noLogDilaog.title, globalHelptext.noLogDilaog.message);
    }
  }

  doAdd(id?: number): void {
    this.modalService.openInSlideIn(CloudsyncFormComponent, id);
  }

  doEdit(id: number): void {
    this.doAdd(id);
  }
}
