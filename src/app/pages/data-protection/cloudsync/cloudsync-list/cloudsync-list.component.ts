import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { InputTableConf } from 'app/pages/common/entity/entity-table/entity-table.component';
import * as cronParser from 'cron-parser';
import { Moment } from 'moment';
import {
  AppLoaderService,
  CloudCredentialService,
  DialogService,
  JobService,
  TaskService,
  WebSocketService,
} from '../../../../services';
import { DialogFormConfiguration } from '../../../common/entity/entity-dialog/dialog-form-configuration.interface';
import { T } from '../../../../translate-marker';
import { EntityUtils } from '../../../common/entity/utils';
import globalHelptext from '../../../../helptext/global-helptext';
import helptext from '../../../../helptext/data-protection/cloudsync/cloudsync-form';
import { CloudsyncFormComponent } from '../cloudsync-form/cloudsync-form.component';
import { MatDialog } from '@angular/material/dialog';
import { ModalService } from 'app/services/modal.service';

@Component({
  selector: 'app-cloudsync-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
  providers: [JobService, TaskService, CloudCredentialService],
})
export class CloudsyncListComponent implements InputTableConf {
  public title = 'Cloud Sync Tasks';
  public queryCall = 'cloudsync.query';
  public route_add: string[] = ['tasks', 'cloudsync', 'add'];
  public route_add_tooltip = 'Add Cloud Sync Task';
  public route_edit: string[] = ['tasks', 'cloudsync', 'edit'];
  public wsDelete = 'cloudsync.delete';
  protected entityList: any;
  public asyncView = true;

  public columns: Array<any> = [
    { name: T('Description'), prop: 'description', always_display: true },
    { name: T('Credential'), prop: 'credential', hidden: true },
    { name: T('Direction'), prop: 'direction', hidden: true },
    { name: T('Transfer Mode'), prop: 'transfer_mode', hidden: true },
    { name: T('Path'), prop: 'path', hidden: true },
    {
      name: T('Schedule'),
      prop: 'cron',
      hidden: true,
      widget: {
        icon: 'calendar-range',
        component: 'TaskScheduleListComponent',
      },
    },
    { name: T('Next Run'), prop: 'next_run', hidden: true },
    { name: T('Minute'), prop: 'minute', hidden: true },
    { name: T('Hour'), prop: 'hour', hidden: true },
    { name: T('Day of Month'), prop: 'dom', hidden: true },
    { name: T('Month'), prop: 'month', hidden: true },
    { name: T('Day of Week'), prop: 'dow', hidden: true },
    {
      name: T('Status'),
      prop: 'state',
      state: 'state',
      infoStates: ['NOT RUN SINCE LAST BOOT'],
      button: true,
    },
    { name: T('Enabled'), prop: 'enabled' },
  ];
  public rowIdentifier = 'description';
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Cloud Sync Task',
      key_props: ['description'],
    },
  };

  constructor(
    protected router: Router,
    protected ws: WebSocketService,
    protected translateService: TranslateService,
    protected dialog: DialogService,
    protected job: JobService,
    protected aroute: ActivatedRoute,
    protected matDialog: MatDialog,
    protected modalService: ModalService,
    protected cloudCredentialService: CloudCredentialService,
    protected loader: AppLoaderService,
  ) {}

  afterInit(entityList: any) {
    this.entityList = entityList;
  }

  resourceTransformIncomingRestData(data) {
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
        task.state = { state: T('NOT RUN SINCE LAST BOOT') };
      } else {
        task.state = { state: task.job.state };
        this.job.getJobStatus(task.job.id).subscribe((t) => {
          task.state = t.job ? { state: t.job.state } : null;
        });
      }

      return task;
    });
  }

  getActions(parentrow) {
    return [
      {
        actionName: parentrow.description,
        id: 'run_now',
        label: T('Run Now'),
        icon: 'play_arrow',
        name: 'run',
        onClick: (row) => {
          this.dialog.confirm(T('Run Now'), T('Run this cloud sync now?'), true).subscribe((res) => {
            if (res) {
              row.state = 'RUNNING';
              this.ws.call('cloudsync.sync', [row.id]).subscribe(
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
        label: T('Stop'),
        icon: 'stop',
        onClick: (row) => {
          this.dialog.confirm(T('Stop'), T('Stop this cloud sync?'), true).subscribe((res) => {
            if (res) {
              this.ws.call('cloudsync.abort', [row.id]).subscribe(
                (wsRes) => {
                  this.dialog.Info(
                    T('Task Stopped'),
                    T('Cloud sync <i>') + row.description + T('</i> stopped.'),
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
        label: helptext.action_button_dry_run,
        icon: 'sync',
        onClick: (row) => {
          this.dialog.confirm(helptext.dry_run_title, helptext.dry_run_dialog, true).subscribe((dialog_res) => {
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
        label: T('Restore'),
        icon: 'restore',
        onClick: (row) => {
          const parent = this;
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
                  { label: 'SYNC', value: 'SYNC' },
                  { label: 'COPY', value: 'COPY' },
                ],
                value: 'COPY',
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
            saveButtonText: 'Restore',
            afterInit: function (entityDialog) {
              entityDialog.formGroup.get('transfer_mode').valueChanges.subscribe((mode) => {
                const paragraph = conf.fieldConfig.find((config) => config.name === 'transfer_mode_warning');
                switch (mode) {
                  case 'SYNC':
                    paragraph.paraText = helptext.transfer_mode_warning_sync;
                    paragraph.paragraphIcon = 'sync';
                    break;
                  default:
                    paragraph.paraText = helptext.transfer_mode_warning_copy;
                    paragraph.paragraphIcon = 'add_to_photos';
                }
              });
            },
            customSubmit: function (entityDialog) {
              parent.entityList.loader.open();
              parent.ws.call('cloudsync.restore', [row.id, entityDialog.formValue]).subscribe(
                (res) => {
                  entityDialog.dialogRef.close(true);
                  parent.entityList.loaderOpen = true;
                  parent.entityList.needRefreshTable = true;
                  parent.entityList.getData();
                },
                (err) => {
                  parent.entityList.loader.close(true);
                  new EntityUtils().handleWSError(entityDialog, err, parent.dialog);
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
        icon: 'edit',
        label: T('Edit'),
        onClick: (row) => {
          this.doEdit(row.id);
        },
      },
      {
        actionName: parentrow.description,
        id: 'delete',
        label: T('Delete'),
        icon: 'delete',
        onClick: (row) => {
          this.entityList.doDelete(row);
        },
      },
    ];
  }

  isActionVisible(actionId: string, row: any) {
    if (actionId === 'run_now' && row.job && row.job.state === 'RUNNING') {
      return false;
    } else if (actionId === 'stop' && (row.job ? row.job && row.job.state !== 'RUNNING' : true)) {
      return false;
    }
    return true;
  }

  onButtonClick(row) {
    this.stateButton(row);
  }

  stateButton(row) {
    if (row.job) {
      if (row.state.state === 'RUNNING') {
        this.entityList.runningStateButton(row.job.id);
      } else {
        this.job.showLogs(row.job);
      }
    } else {
      this.dialog.Info(globalHelptext.noLogDilaog.title, globalHelptext.noLogDilaog.message);
    }
  }

  doAdd(id?: number) {
    this.modalService.open(
      'slide-in-form',
      new CloudsyncFormComponent(
        this.router,
        this.aroute,
        this.loader,
        this.dialog,
        this.matDialog,
        this.ws,
        this.cloudCredentialService,
        this.job,
        this.modalService,
      ),
      id,
    );
  }

  doEdit(id: number) {
    this.doAdd(id);
  }
}
