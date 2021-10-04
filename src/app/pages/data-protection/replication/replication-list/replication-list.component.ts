import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { Validators } from '@angular/forms';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { JobState } from 'app/enums/job-state.enum';
import helptext from 'app/helptext/data-protection/replication/replication';
import globalHelptext from 'app/helptext/global-helptext';
import { Job } from 'app/interfaces/job.interface';
import { ReplicationTask, ReplicationTaskUi } from 'app/interfaces/replication-task.interface';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { EntityFormService } from 'app/pages/common/entity/entity-form/services/entity-form.service';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { ReplicationFormComponent } from 'app/pages/data-protection/replication/replication-form/replication-form.component';
import { ReplicationWizardComponent } from 'app/pages/data-protection/replication/replication-wizard/replication-wizard.component';
import {
  DialogService,
  JobService,
  WebSocketService,
  StorageService,
  TaskService,
  KeychainCredentialService,
  ReplicationService,
} from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  selector: 'app-replication-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
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
export class ReplicationListComponent implements EntityTableConfig {
  title = T('Replication Tasks');
  queryCall: 'replication.query' = 'replication.query';
  wsDelete: 'replication.delete' = 'replication.delete';
  route_add: string[] = ['tasks', 'replication', 'wizard'];
  route_edit: string[] = ['tasks', 'replication', 'edit'];
  route_success: string[] = ['tasks', 'replication'];
  entityList: EntityTableComponent;
  asyncView = true;

  columns = [
    { name: T('Name'), prop: 'name', always_display: true },
    { name: T('Direction'), prop: 'direction' },
    { name: T('Transport'), prop: 'transport', hidden: true },
    { name: T('SSH Connection'), prop: 'ssh_connection', hidden: true },
    { name: T('Source Dataset'), prop: 'source_datasets', hidden: true },
    { name: T('Target Dataset'), prop: 'target_dataset', hidden: true },
    { name: T('Recursive'), prop: 'recursive', hidden: true },
    { name: T('Auto'), prop: 'auto', hidden: true },
    { name: T('Enabled'), prop: 'enabled', checkbox: true },
    {
      name: T('State'), prop: 'state', button: true, state: 'state',
    },
    { name: T('Last Snapshot'), prop: 'task_last_snapshot' },
  ];

  config = {
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
    protected modalService: ModalService,
    protected loader: AppLoaderService,
    private translate: TranslateService,
  ) {}

  afterInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;
    this.modalService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      this.entityList.getData();
    });
  }

  resourceTransformIncomingRestData(tasks: ReplicationTask[]): ReplicationTaskUi[] {
    return tasks.map((task) => {
      return {
        ...task,
        ssh_connection: task.ssh_credentials ? (task.ssh_credentials as any).name : '-',
        task_last_snapshot: task.state.last_snapshot ? task.state.last_snapshot : T('No snapshots sent yet'),
      };
    });
  }

  getActions(parentrow: ReplicationTaskUi): EntityTableAction[] {
    return [
      {
        id: parentrow.name,
        icon: 'play_arrow',
        name: 'run',
        label: T('Run Now'),
        onClick: (row: ReplicationTaskUi) => {
          this.dialog.confirm({
            title: T('Run Now'),
            message: T('Replicate <i>') + row.name + T('</i> now?'),
            hideCheckBox: true,
          }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
            row.state = { state: JobState.Running };
            this.ws.call('replication.run', [row.id]).pipe(untilDestroyed(this)).subscribe(
              (jobId: number) => {
                this.dialog.info(
                  T('Task started'),
                  this.translate.instant('Replication <i>{name}</i> has started.', { name: row.name }),
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
          });
        },
      },
      {
        actionName: (parentrow as any).description,
        id: 'restore',
        name: 'restore',
        label: T('Restore'),
        icon: 'restore',
        onClick: (row: ReplicationTaskUi) => {
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
            customSubmit: (entityDialog: EntityDialogComponent) => {
              this.loader.open();
              this.ws.call('replication.restore', [row.id, entityDialog.formValue]).pipe(untilDestroyed(this)).subscribe(
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
        id: parentrow.name,
        icon: 'edit',
        name: 'edit',
        label: T('Edit'),
        onClick: (row: ReplicationTaskUi) => {
          this.doEdit(row.id);
        },
      },
      {
        id: parentrow.name,
        icon: 'delete',
        name: 'delete',
        label: T('Delete'),
        onClick: (row: ReplicationTaskUi) => {
          this.entityList.doDelete(row);
        },
      },
    ];
  }

  onButtonClick(row: ReplicationTaskUi): void {
    this.stateButton(row);
  }

  stateButton(row: ReplicationTaskUi): void {
    if (row.job) {
      if (row.state.state === JobState.Running) {
        this.entityList.runningStateButton(row.job.id);
      } else if (row.state.state === JobState.Hold) {
        this.dialog.info(T('Task is on hold'), row.state.reason, '500px', 'info', true);
      } else if (row.state.warnings && row.state.warnings.length > 0) {
        let list = '';
        row.state.warnings.forEach((warning: string) => {
          list += warning + '\n';
        });
        this.dialog.errorReport(row.state.state, `<pre>${list}</pre>`);
      } else {
        this.dialog.errorReport(row.state.state, `<pre>${row.state.error}</pre>`);
      }
    } else {
      this.dialog.info(globalHelptext.noLogDilaog.title, globalHelptext.noLogDilaog.message);
    }
  }

  onCheckboxChange(row: ReplicationTaskUi): void {
    this.ws.call('replication.update', [row.id, { enabled: row.enabled }]).pipe(untilDestroyed(this)).subscribe(
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
    this.modalService.openInSlideIn(ReplicationWizardComponent);
  }

  doEdit(id: number): void {
    this.modalService.openInSlideIn(ReplicationFormComponent, id);
  }
}
