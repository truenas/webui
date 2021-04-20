import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';

import { EntityUtils } from 'app/pages/common/entity/utils';
import { T } from 'app/translate-marker';
import {
  DialogService,
  JobService,
  WebSocketService,
  StorageService,
  TaskService,
  KeychainCredentialService,
  ReplicationService,
} from 'app/services';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import globalHelptext from 'app/helptext/global-helptext';
import helptext from 'app/helptext/data-protection/replication/replication';
import { EntityJobState } from 'app/pages/common/entity/entity-job/entity-job.interface';
import { EntityFormService } from 'app/pages/common/entity/entity-form/services/entity-form.service';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { ModalService } from 'app/services/modal.service';
import { ReplicationWizardComponent } from 'app/pages/data-protection/replication/replication-wizard/replication-wizard.component';
import { ReplicationFormComponent } from 'app/pages/data-protection/replication/replication-form/replication-form.component';
import { ReplicationTask } from 'app/pages/data-protection/replication/replication.interface';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table';

@Component({
  selector: 'app-replication-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
  providers: [
    JobService,
    StorageService,
    TaskService,
    KeychainCredentialService,
    ReplicationService,
    EntityFormService,
    DatePipe,
  ],
})
export class ReplicationListComponent {
  public title = T('Replication Tasks');
  protected queryCall = 'replication.query';
  protected wsDelete = 'replication.delete';
  protected route_add: string[] = ['tasks', 'replication', 'wizard'];
  protected route_edit: string[] = ['tasks', 'replication', 'edit'];
  protected route_success: string[] = ['tasks', 'replication'];
  public entityList: EntityTableComponent;
  protected asyncView = true;

  public columns: Array<any> = [
    { name: T('Name'), prop: 'name', always_display: true },
    { name: T('Direction'), prop: 'direction' },
    { name: T('Transport'), prop: 'transport', hidden: true },
    { name: T('SSH Connection'), prop: 'ssh_connection', hidden: true },
    { name: T('Source Dataset'), prop: 'source_datasets', hidden: true },
    { name: T('Target Dataset'), prop: 'target_dataset', hidden: true },
    { name: T('Recursive'), prop: 'recursive', hidden: true },
    { name: T('Auto'), prop: 'auto', hidden: true },
    { name: T('Enabled'), prop: 'enabled', checkbox: true },
    { name: T('State'), prop: 'state', button: true, state: 'state' },
    { name: T('Last Snapshot'), prop: 'task_last_snapshot' },
  ];

  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: T('Replication Task'),
      key_props: ['name'],
    },
  };

  constructor(
    private ws: WebSocketService,
    private dialog: DialogService,
    protected job: JobService,
    protected storage: StorageService,
    protected http: HttpClient,
    protected modalService: ModalService,
    protected taskService: TaskService,
    protected keychainCredentialService: KeychainCredentialService,
    protected replicationService: ReplicationService,
    protected loader: AppLoaderService,
    protected datePipe: DatePipe,
    protected entityFormService: EntityFormService,
  ) {}

  afterInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;
  }

  resourceTransformIncomingRestData(tasks: any[]): ReplicationTask[] {
    return tasks.map((task) => {
      task.ssh_connection = task.ssh_credentials ? task.ssh_credentials.name : '-';
      task.task_last_snapshot = task.state.last_snapshot ? task.state.last_snapshot : T('No snapshots sent yet');
      return task;
    });
  }

  getActions(parentrow: any): any[] {
    return [
      {
        id: parentrow.name,
        icon: 'play_arrow',
        name: 'run',
        label: T('Run Now'),
        onClick: (row) => {
          this.dialog.confirm(T('Run Now'), T('Replicate <i>') + row.name + T('</i> now?'), true).subscribe((res) => {
            if (res) {
              row.state = { state: EntityJobState.Running };
              this.ws.call('replication.run', [row.id]).subscribe(
                (res) => {
                  this.dialog.Info(
                    T('Task started'),
                    T('Replication <i>') + row.name + T('</i> has started.'),
                    '500px',
                    'info',
                    true,
                  );
                  this.job.getJobStatus(res).subscribe((job) => {
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
        label: T('Restore'),
        icon: 'restore',
        onClick: (row) => {
          const parent = this;
          const conf: DialogFormConfiguration = {
            title: helptext.replication_restore_dialog.title,
            fieldConfig: [
              {
                type: 'input',
                name: 'name',
                placeholder: helptext.name_placeholder,
                tooltip: helptext.name_tooltip,
                validation: [Validators.required],
                required: true,
              },
              {
                type: 'explorer',
                explorerType: 'dataset',
                initial: '',
                name: 'target_dataset',
                placeholder: helptext.target_dataset_placeholder,
                tooltip: helptext.target_dataset_tooltip,
                validation: [Validators.required],
                required: true,
              },
            ],
            saveButtonText: helptext.replication_restore_dialog.saveButton,
            customSubmit: function (entityDialog) {
              parent.loader.open();
              parent.ws.call('replication.restore', [row.id, entityDialog.formValue]).subscribe(
                (res) => {
                  entityDialog.dialogRef.close(true);
                  parent.entityList.getData();
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
      {
        id: parentrow.name,
        icon: 'edit',
        name: 'edit',
        label: T('Edit'),
        onClick: (row) => {
          this.doEdit(row.id);
        },
      },
      {
        id: parentrow.name,
        icon: 'delete',
        name: 'delete',
        label: T('Delete'),
        onClick: (row) => {
          this.entityList.doDelete(row);
        },
      },
    ];
  }

  onButtonClick(row: any): void {
    this.stateButton(row);
  }

  stateButton(row: any): void {
    if (row.job) {
      if (row.state.state === EntityJobState.Running) {
        this.entityList.runningStateButton(row.job.id);
      } else if (row.state.state === EntityJobState.Hold) {
        this.dialog.Info(T('Task is on hold'), row.state.reason, '500px', 'info', true);
      } else {
        this.job.showLogs(row.job);
      }
    } else {
      this.dialog.Info(globalHelptext.noLogDilaog.title, globalHelptext.noLogDilaog.message);
    }
  }

  onCheckboxChange(row: any): void {
    this.ws.call('replication.update', [row.id, { enabled: row.enabled }]).subscribe(
      (res) => {
        row.enabled = res.enabled;
        if (!res) {
          row.enabled = !row.enabled;
        }
      },
      (err) => {
        row.enabled = !row.enabled;
        new EntityUtils().handleWSError(this, err, this.dialog);
      },
    );
  }

  doAdd(): void {
    this.modalService.open(
      'slide-in-form',
      new ReplicationWizardComponent(
        this.keychainCredentialService,
        this.loader,
        this.dialog,
        this.ws,
        this.replicationService,
        this.datePipe,
        this.entityFormService,
        this.modalService,
      ),
    );
  }

  doEdit(id: number): void {
    this.modalService.open(
      'slide-in-form',
      new ReplicationFormComponent(
        this.ws,
        this.taskService,
        this.storage,
        this.keychainCredentialService,
        this.replicationService,
        this.modalService,
      ),
      id,
    );
  }
}
