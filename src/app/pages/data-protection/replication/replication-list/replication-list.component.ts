import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, ChangeDetectorRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { formatDistanceToNow } from 'date-fns';
import {
  filter, switchMap, tap,
} from 'rxjs/operators';
import { JobState } from 'app/enums/job-state.enum';
import { tapOnce } from 'app/helpers/operators/tap-once.operator';
import globalHelptext from 'app/helptext/global-helptext';
import { Job } from 'app/interfaces/job.interface';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { ReplicationTask, ReplicationTaskUi } from 'app/interfaces/replication-task.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { ShowLogsDialogComponent } from 'app/modules/common/dialog/show-logs-dialog/show-logs-dialog.component';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/modules/entity/entity-table/entity-table.interface';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ReplicationFormComponent } from 'app/pages/data-protection/replication/replication-form/replication-form.component';
import {
  ReplicationRestoreDialogComponent,
} from 'app/pages/data-protection/replication/replication-restore-dialog/replication-restore-dialog.component';
import { ReplicationWizardComponent } from 'app/pages/data-protection/replication/replication-wizard/replication-wizard.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { KeychainCredentialService } from 'app/services/keychain-credential.service';
import { ReplicationService } from 'app/services/replication.service';
import { StorageService } from 'app/services/storage.service';
import { TaskService } from 'app/services/task.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  template: '<ix-entity-table [title]="title" [conf]="this"></ix-entity-table>',
  providers: [
    StorageService,
    TaskService,
    KeychainCredentialService,
    ReplicationService,
    DatePipe,
  ],
})
export class ReplicationListComponent implements EntityTableConfig<ReplicationTaskUi> {
  title = this.translate.instant('Replication Tasks');
  queryCall = 'replication.query' as const;
  wsDelete = 'replication.delete' as const;
  routeAdd: string[] = ['tasks', 'replication', 'wizard'];
  routeEdit: string[] = ['tasks', 'replication', 'edit'];
  routeSuccess: string[] = ['tasks', 'replication'];
  queryCallOption: QueryParams<void> = [[], { extra: { check_dataset_encryption_keys: true } }];
  entityList: EntityTableComponent<ReplicationTaskUi>;
  filterValue = '';

  columns = [
    { name: this.translate.instant('Name'), prop: 'name', always_display: true },
    { name: this.translate.instant('Direction'), prop: 'direction' },
    { name: this.translate.instant('Transport'), prop: 'transport', hidden: true },
    { name: this.translate.instant('SSH Connection'), prop: 'ssh_connection', hidden: true },
    { name: this.translate.instant('Source Dataset'), prop: 'source_datasets', hidden: true },
    { name: this.translate.instant('Target Dataset'), prop: 'target_dataset', hidden: true },
    { name: this.translate.instant('Recursive'), prop: 'recursive', hidden: true },
    { name: this.translate.instant('Auto'), prop: 'auto', hidden: true },
    { name: this.translate.instant('Enabled'), prop: 'enabled', checkbox: true },
    { name: this.translate.instant('Last Run'), prop: 'last_run', hidden: true },
    {
      name: this.translate.instant('State'), prop: 'state', button: true, state: 'state',
    },
    { name: this.translate.instant('Last Snapshot'), prop: 'task_last_snapshot' },
  ];

  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: this.translate.instant('Replication Task'),
      key_props: ['name'],
    },
  };

  constructor(
    private ws: WebSocketService,
    private dialogService: DialogService,
    protected loader: AppLoaderService,
    private slideInService: IxSlideInService,
    private translate: TranslateService,
    private matDialog: MatDialog,
    private errorHandler: ErrorHandlerService,
    private route: ActivatedRoute,
    private snackbar: SnackbarService,
    private cdr: ChangeDetectorRef,
    private storage: StorageService,
  ) {
    this.filterValue = this.route.snapshot.paramMap.get('dataset') || '';
  }

  afterInit(entityList: EntityTableComponent<ReplicationTaskUi>): void {
    this.entityList = entityList;
  }

  resourceTransformIncomingRestData(tasks: ReplicationTask[]): ReplicationTaskUi[] {
    return tasks.map((task) => {
      return {
        ...task,
        last_run:
          task.job?.time_finished?.$date
            ? formatDistanceToNow(task.job?.time_finished?.$date, { addSuffix: true })
            : this.translate.instant('N/A'),
        ssh_connection: task.ssh_credentials ? task.ssh_credentials.name : '-',
        task_last_snapshot:
          task.state.last_snapshot ? task.state.last_snapshot : this.translate.instant('No snapshots sent yet'),
      };
    });
  }

  getActions(parentrow: ReplicationTaskUi): EntityTableAction[] {
    const actions: EntityTableAction[] =  [
      {
        id: parentrow.name,
        icon: 'play_arrow',
        name: 'run',
        label: this.translate.instant('Run Now'),
        onClick: (row: ReplicationTaskUi) => {
          this.dialogService.confirm({
            title: this.translate.instant('Run Now'),
            message: this.translate.instant('Replicate «{name}» now?', { name: row.name }),
            hideCheckbox: true,
          }).pipe(
            filter(Boolean),
            tap(() => row.state = { state: JobState.Running }),
            switchMap(() => this.ws.job('replication.run', [row.id])),
            tapOnce(() => this.snackbar.success(
              this.translate.instant('Replication «{name}» has started.', { name: row.name }),
            )),
            untilDestroyed(this),
          ).subscribe({
            next: (job: Job) => {
              row.state = { state: job.state };
              row.job = { ...job };
              this.cdr.markForCheck();
            },
            error: (error: Job) => {
              this.dialogService.error(this.errorHandler.parseJobError(error));
            },
          });
        },
      },
      {
        actionName: 'restore',
        id: 'restore',
        name: 'restore',
        label: this.translate.instant('Restore'),
        icon: 'restore',
        onClick: (row: ReplicationTaskUi) => {
          const dialog = this.matDialog.open(ReplicationRestoreDialogComponent, {
            data: row.id,
          });
          dialog
            .afterClosed()
            .pipe(untilDestroyed(this))
            .subscribe(() => {
              this.entityList.needRefreshTable = true;
              this.entityList.getData();
            });
        },
      },
      {
        id: parentrow.name,
        icon: 'edit',
        name: 'edit',
        label: this.translate.instant('Edit'),
        onClick: (row: ReplicationTaskUi) => {
          this.doEdit(row.id);
        },
      },
    ];
    if (parentrow.has_encrypted_dataset_keys) {
      actions.push({
        id: parentrow.name,
        icon: 'download',
        name: 'download_keys',
        label: this.translate.instant('Download keys'),
        onClick: (row) => {
          this.loader.open();
          this.ws.call('core.download', ['pool.dataset.export_keys_for_replication', [row.id], `${row.name}_encryption_keys.json`]).pipe(untilDestroyed(this)).subscribe({
            next: ([, url]) => {
              this.loader.close();
              const mimetype = 'application/json';
              this.storage.streamDownloadFile(url, `${row.name}_encryption_keys.json`, mimetype).pipe(untilDestroyed(this)).subscribe({
                next: (file) => {
                  this.storage.downloadBlob(file, `${row.name}_encryption_keys.json`);
                },
                error: (err: HttpErrorResponse) => {
                  this.dialogService.error(this.errorHandler.parseHttpError(err));
                },
              });
            },
            error: (err) => {
              this.loader.close();
              this.dialogService.error(this.errorHandler.parseWsError(err));
            },
          });
        },
      });
    }
    actions.push({
      id: parentrow.name,
      icon: 'delete',
      name: 'delete',
      label: this.translate.instant('Delete'),
      onClick: (row: ReplicationTaskUi) => {
        this.entityList.doDelete(row);
      },
    });
    return actions;
  }

  onButtonClick(row: ReplicationTaskUi): void {
    this.stateButton(row);
  }

  stateButton(row: ReplicationTaskUi): void {
    if (row.job) {
      if (row.state.state === JobState.Running) {
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
      } else if (row.state.state === JobState.Hold) {
        this.dialogService.info(this.translate.instant('Task is on hold'), row.state.reason);
      } else if (row.state.warnings && row.state.warnings.length > 0) {
        let list = '';
        row.state.warnings.forEach((warning: string) => {
          list += warning + '\n';
        });
        this.dialogService.error({ title: row.state.state, message: `<pre>${list}</pre>` });
      } else if (row.state.error) {
        this.dialogService.error({ title: row.state.state, message: `<pre>${row.state.error}</pre>` });
      } else {
        this.matDialog.open(ShowLogsDialogComponent, { data: row.job });
      }
    } else {
      this.dialogService.warn(globalHelptext.noLogDialog.title, globalHelptext.noLogDialog.message);
    }
  }

  onCheckboxChange(row: ReplicationTaskUi): void {
    this.ws.call('replication.update', [row.id, { enabled: row.enabled }]).pipe(untilDestroyed(this)).subscribe({
      next: (task) => {
        row.enabled = task.enabled;
        if (!task) {
          row.enabled = !row.enabled;
        }
      },
      error: (err: WebsocketError) => {
        row.enabled = !row.enabled;
        this.dialogService.error(this.errorHandler.parseWsError(err));
      },
    });
  }

  doAdd(): void {
    const slideInRef = this.slideInService.open(ReplicationWizardComponent, { wide: true });
    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => this.entityList.getData());
  }

  doEdit(id: number): void {
    const replication = this.entityList.rows.find((row) => row.id === id);
    const slideInRef = this.slideInService.open(ReplicationFormComponent, { wide: true, data: replication });
    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => this.entityList.getData());
  }
}
