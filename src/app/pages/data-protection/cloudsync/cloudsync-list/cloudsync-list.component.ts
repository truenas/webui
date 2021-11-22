import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { ExplorerType } from 'app/enums/explorer-type.enum';
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

@UntilDestroy()
@Component({
  selector: 'app-cloudsync-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
  providers: [JobService, TaskService, CloudCredentialService],
})
export class CloudsyncListComponent implements EntityTableConfig<CloudSyncTaskUi> {
  title = this.translate.instant('Cloud Sync Tasks');
  queryCall = 'cloudsync.query' as const;
  route_add: string[] = ['tasks', 'cloudsync', 'add'];
  route_add_tooltip = 'Add Cloud Sync Task';
  route_edit: string[] = ['tasks', 'cloudsync', 'edit'];
  wsDelete = 'cloudsync.delete' as const;
  entityList: EntityTableComponent;
  asyncView = true;

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
      const formattedCronSchedule = `${task.schedule.minute} ${task.schedule.hour} ${task.schedule.dom} ${task.schedule.month} ${task.schedule.dow}`;
      transformed.credential = task.credentials.name;
      transformed.cron_schedule = task.enabled ? formattedCronSchedule : this.translate.instant('Disabled');
      transformed.frequency = this.taskService.getTaskCronDescription(formattedCronSchedule);
      transformed.next_run = task.enabled ? this.taskService.getTaskNextRun(formattedCronSchedule) : this.translate.instant('Disabled');

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
            .pipe(untilDestroyed(this)).subscribe((res: boolean) => {
              if (res) {
                row.state = { state: JobState.Running };
                this.ws.call('cloudsync.sync', [row.id]).pipe(untilDestroyed(this)).subscribe(
                  (jobId: number) => {
                    this.dialog.info(
                      this.translate.instant('Task Started'),
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
                    new EntityUtils().handleWsError(this.entityList, err);
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
        label: this.translate.instant('Stop'),
        icon: 'stop',
        onClick: (row: CloudSyncTaskUi) => {
          this.dialog
            .confirm({
              title: this.translate.instant('Stop'),
              message: this.translate.instant('Stop this cloud sync?'),
              hideCheckBox: true,
            })
            .pipe(untilDestroyed(this)).subscribe((res: boolean) => {
              if (res) {
                this.ws.call('cloudsync.abort', [row.id]).pipe(untilDestroyed(this)).subscribe(
                  () => {
                    this.dialog.info(
                      this.translate.instant('Task Stopped'),
                      this.translate.instant('Cloud sync <i>{taskName}</i> stopped.', { taskName: row.description }),
                      '500px',
                      'info',
                      true,
                    );
                  },
                  (wsErr) => {
                    new EntityUtils().handleWsError(this.entityList, wsErr);
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
                      this.translate.instant('Task Started'),
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
                    new EntityUtils().handleWsError(this.entityList, err);
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
        label: this.translate.instant('Restore'),
        icon: 'restore',
        onClick: (row: CloudSyncTaskUi) => {
          const conf: DialogFormConfiguration = {
            title: this.translate.instant('Restore Cloud Sync Task'),
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
                  { label: this.translate.instant('SYNC'), value: TransferMode.Sync },
                  { label: this.translate.instant('COPY'), value: TransferMode.Copy },
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
                explorerType: ExplorerType.Directory,
                name: 'path',
                placeholder: helptext.path_placeholder,
                tooltip: helptext.path_tooltip,
                validation: helptext.path_validation,
                initial: '/mnt',
                required: true,
              },
            ],
            saveButtonText: this.translate.instant('Restore'),
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
                  new EntityUtils().handleWsError(entityDialog, err, this.dialog);
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
