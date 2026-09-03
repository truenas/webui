import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, Type, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent,
  TnCellDefDirective,
  TnDetailRowDefDirective,
  TnDialog,
  TnEmptyComponent,
  TnHeaderCellDefDirective,
  TnTableColumnDirective,
  TnTableComponent,
  TnTablePagerComponent,
} from '@truenas/ui-components';
import { filter, switchMap, tap } from 'rxjs';
import { replicationTaskEmptyConfig } from 'app/constants/empty-configs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { JobState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { emptyConfigIcon } from 'app/helpers/empty-config.helper';
import { tapOnce } from 'app/helpers/operators/tap-once.operator';
import { translated } from 'app/helpers/translated.helper';
import { Job } from 'app/interfaces/job.interface';
import { ReplicationTask } from 'app/interfaces/replication-task.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FlattenEmptyMessagePipe } from 'app/modules/pipes/flatten-empty-message/flatten-empty-message.pipe';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SidePanelHostCloseable } from 'app/modules/slide-ins/side-panel-form.directive';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { AsyncDataProvider } from 'app/modules/tn-table/classes/async-data-provider/async-data-provider';
import { column } from 'app/modules/tn-table/column-configs';
import { TableColumnPickerComponent } from 'app/modules/tn-table/components/table-column-picker/table-column-picker.component';
import { TableDetailsRowComponent } from 'app/modules/tn-table/components/table-details-row/table-details-row.component';
import { createTable, detailActionTestId, tnTableListHost } from 'app/modules/tn-table/utils';
import {
  TableRelativeDateCellComponent,
  formatRelativeDateValue,
} from 'app/modules/tn-table-cells/relative-date-cell/table-relative-date-cell.component';
import {
  formatTaskStateValue, TaskStateCellComponent,
} from 'app/modules/tn-table-cells/state-cell/task-state-cell.component';
import { TableTextCellComponent } from 'app/modules/tn-table-cells/text-cell/table-text-cell.component';
import { TableToggleCellComponent } from 'app/modules/tn-table-cells/toggle-cell/table-toggle-cell.component';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  ReplicationFormComponent,
} from 'app/pages/data-protection/replication/replication-form/replication-form.component';
import { replicationListElements } from 'app/pages/data-protection/replication/replication-list/replication-list.elements';
import {
  ReplicationRestoreDialog,
} from 'app/pages/data-protection/replication/replication-restore-dialog/replication-restore-dialog.component';
import {
  ReplicationWizardComponent,
} from 'app/pages/data-protection/replication/replication-wizard/replication-wizard.component';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-replication-list',
  templateUrl: './replication-list.component.html',
  styleUrls: ['./replication-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    BasicSearchComponent,
    TableColumnPickerComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    UiSearchDirective,
    TnEmptyComponent,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnDetailRowDefDirective,
    TnTablePagerComponent,
    TableDetailsRowComponent,
    TableRelativeDateCellComponent,
    TableTextCellComponent,
    TableToggleCellComponent,
    TaskStateCellComponent,
    YesNoPipe,
    FlattenEmptyMessagePipe,
    TranslateModule,
  ],
})
export class ReplicationListComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private formPanel = inject(FormSidePanelService);
  private dialogService = inject(DialogService);
  private errorHandler = inject(ErrorHandlerService);
  private tnDialog = inject(TnDialog);
  private snackbar = inject(SnackbarService);
  private download = inject(DownloadService);
  private loader = inject(LoaderService);
  private destroyRef = inject(DestroyRef);

  private replicationTasks: ReplicationTask[] = [];
  protected readonly searchQuery = signal('');
  protected readonly jobState = JobState;
  protected readonly requiredRoles = [Role.ReplicationTaskWrite, Role.ReplicationTaskWritePull];
  protected readonly searchableElements = replicationListElements;
  protected readonly EmptyType = EmptyType;

  private readonly replicationTasks$ = this.api.call('replication.query', [[], {
    extra: {
      check_dataset_encryption_keys: true,
    },
  }]).pipe(tap((replicationTasks) => this.replicationTasks = replicationTasks));

  readonly dataProvider = new AsyncDataProvider<ReplicationTask>(this.replicationTasks$);

  // Bound from the shared catalog config rather than inlined in the template, so the
  // translated string has a single source of truth and follows a language change.
  protected readonly emptyConfig = replicationTaskEmptyConfig;
  protected readonly emptyIcon = emptyConfigIcon(replicationTaskEmptyConfig);

  // One source of truth per column title: the header, the cell (whose test id is built
  // from it) and the column model all read the same entry, so a rename cannot silently
  // change a data-test value. `translated` re-runs it on a language change — and because
  // the column model is passed as a factory, the picker and detail row re-read it too.
  protected readonly titles = translated(() => ({
    name: this.translate.instant('Name'),
    direction: this.translate.instant('Direction'),
    transport: this.translate.instant('Transport'),
    sshConnection: this.translate.instant('SSH Connection'),
    sourceDataset: this.translate.instant('Source Dataset'),
    targetDataset: this.translate.instant('Target Dataset'),
    recursive: this.translate.instant('Recursive'),
    auto: this.translate.instant('Auto'),
    lastRun: this.translate.instant('Last Run'),
    state: this.translate.instant('State'),
    enabled: this.translate.instant('Enabled'),
    lastSnapshot: this.translate.instant('Last Snapshot'),
  }));

  private yesNoText(value: boolean): string {
    return this.translate.instant(value ? 'Yes' : 'No');
  }

  protected sourceDatasets(row: ReplicationTask): string {
    return (row.source_datasets || []).join(', ');
  }

  protected readonly list = tnTableListHost<ReplicationTask>(this.dataProvider, {
    columns: () => createTable<ReplicationTask>([
      column({
        title: this.titles().name,
        propertyName: 'name',
      }),
      column({
        title: this.titles().direction,
        propertyName: 'direction',
      }),
      column({
        title: this.titles().transport,
        propertyName: 'transport',
        hidden: true,
      }),
      column({
        title: this.titles().sshConnection,
        hidden: true,
        propertyName: 'ssh_credentials',
        getValue: (task) => this.getSshConnection(task),
      }),
      column({
        title: this.titles().sourceDataset,
        propertyName: 'source_datasets',
        // A list of datasets: the cell joins them and a details row has to print the same text,
        // or it falls back to String(array) — a comma-run with no spaces.
        formatValue: (row) => this.sourceDatasets(row),
        hidden: true,
      }),
      column({
        title: this.titles().targetDataset,
        propertyName: 'target_dataset',
        hidden: true,
      }),
      column({
        title: this.titles().recursive,
        propertyName: 'recursive',
        hidden: true,
        // The table shows this as Yes/No in the template; a details row prints it, under the id
        // that cell resolves.
        formatValue: (row) => this.yesNoText(row.recursive),
        testIdSuffix: 'row-yesno',
      }),
      column({
        title: this.titles().auto,
        propertyName: 'auto',
        hidden: true,
        formatValue: (row) => this.yesNoText(row.auto),
        testIdSuffix: 'row-yesno',
      }),
      column({
        title: this.titles().lastRun,
        columnName: 'last-run',
        getValue: (row) => row.state?.datetime?.$date,
        // The table shows this through <ix-table-relative-date-cell>; a details row prints it,
        // under the id that cell resolves.
        formatValue: (row) => formatRelativeDateValue(row.state?.datetime?.$date, this.translate),
        testIdSuffix: 'row-relative-date',
      }),
      column({
        title: this.titles().state,
        columnName: 'state',
        getValue: (row) => row.state.state,
        // The table shows this as a pill labelled by `jobStateDisplay`; a details row prints it,
        // under the suffix that pill resolves.
        formatValue: (row) => formatTaskStateValue(row.state.state, this.translate),
        testIdSuffix: 'row-state',
      }),
      // The visible column renders as an <ix-table-toggle-cell>, but once the picker hides it
      // <ix-table-details-row> only prints text — so it reads as Yes/No there. Read-only in the
      // detail row is a small regression from the pre-migration toggle — see "Migration
      // follow-ups" in TRUENAS_UI_INTEGRATION.md.
      column({
        title: this.titles().enabled,
        propertyName: 'enabled',
        formatValue: (row) => this.yesNoText(row.enabled),
        testIdSuffix: 'row-toggle',
      }),
      column({
        title: this.titles().lastSnapshot,
        columnName: 'last-snapshot',
        getValue: (task) => this.getLastSnapshot(task),
      }),
    ]),
  });

  protected readonly trackByTaskId = (_index: number, row: ReplicationTask): number => row.id;

  private rowTag(row: ReplicationTask): string {
    return `replication-task-${row.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
  }

  protected readonly uniqueRowTag = this.list.rowTag((row) => this.rowTag(row));

  protected readonly ariaLabel = this.list.perRow(
    (row) => [row.name, this.translate.instant('Replication Task')].join(' '),
  );

  protected detailActionTestId(row: ReplicationTask, action: string): string {
    return detailActionTestId([row.id], action);
  }

  protected getSshConnection(task: ReplicationTask): string {
    return task.ssh_credentials ? task.ssh_credentials.name : this.translate.instant('N/A');
  }

  protected getLastSnapshot(task: ReplicationTask): string {
    return task.state.last_snapshot ? task.state.last_snapshot : this.translate.instant('No snapshots sent yet');
  }

  ngOnInit(): void {
    this.getReplicationTasks();
    this.dataProvider.emptyType$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.onListFiltered(this.searchQuery());
    });
  }

  protected getReplicationTasks(): void {
    this.dataProvider.load();
  }

  protected runNow(row: ReplicationTask): void {
    this.dialogService.confirm({
      message: this.translate.instant('Replicate «{name}» now?', { name: row.name }),
      hideCheckbox: true,
    }).pipe(
      filter(Boolean),
      tap(() => this.updateRowStateAndJob(row, JobState.Running, row.job)),
      switchMap(() => this.api.job('replication.run', [row.id])),
      tapOnce(() => {
        this.snackbar.success(
          this.translate.instant('Replication «{name}» has started.', { name: row.name }),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (job: Job) => {
        row.state = { state: job.state };
        row.job = { ...job };
        this.updateRowStateAndJob(row, job.state, job);
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.errorHandler.showErrorModal(error);
        this.getReplicationTasks();
      },
    });
  }

  protected restore(row: ReplicationTask): void {
    const dialog = this.tnDialog.open(ReplicationRestoreDialog, {
      data: row.id,
    });
    dialog.closed
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.getReplicationTasks());
  }

  // ReplicationWizardComponent is footerless and owns its stepper buttons, so it only provides
  // `SidePanelHostCloseable` (closed + hasUnsavedChanges) rather than extending a panel base.
  private readonly replicationWizard: Type<SidePanelHostCloseable> = ReplicationWizardComponent;

  protected openForm(row?: ReplicationTask): void {
    if (row) {
      this.formPanel.open(ReplicationFormComponent, {
        title: this.translate.instant('Edit Replication Task'),
        wide: true,
        inputs: { replicationToEdit: row },
      }).onSuccess(() => this.getReplicationTasks(), this.destroyRef);
    } else {
      this.formPanel.open(this.replicationWizard, {
        title: this.translate.instant('Replication Task Wizard'),
        wide: true,
        footerless: true,
      }).onSuccess(() => this.getReplicationTasks(), this.destroyRef);
    }
  }

  protected doDelete(row: ReplicationTask): void {
    this.dialogService.confirmDelete({
      message: this.translate.instant('Delete Replication Task <b>"{name}"</b>?', {
        name: row.name,
      }),
      call: () => this.api.call('replication.delete', [row.id]),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.getReplicationTasks());
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query);
    this.dataProvider.setFilter({ query, columnKeys: ['name'] });
  }

  protected downloadKeys(row: ReplicationTask): void {
    const fileName = `${row.name}_encryption_keys.json`;
    this.download.coreDownload({
      fileName,
      method: 'pool.dataset.export_keys_for_replication',
      arguments: [row.id],
      mimeType: 'application/json',
    })
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected onChangeEnabledState(replicationTask: ReplicationTask, toggle: TableToggleCellComponent): void {
    this.api
      .call('replication.update', [replicationTask.id, { enabled: !replicationTask.enabled }])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.getReplicationTasks();
        },
        error: (error: unknown) => {
          toggle.revert();
          this.getReplicationTasks();
          this.errorHandler.showErrorModal(error);
        },
      });
  }

  private updateRowStateAndJob(row: ReplicationTask, state: JobState, job: Job | undefined): void {
    this.replicationTasks = this.replicationTasks.map((task) => {
      if (task.id === row.id) {
        return {
          ...task,
          state: { state },
          job,
        };
      }
      return task;
    });

    // Reapply the current filter to preserve search state while updating the task
    this.dataProvider.setFilter({
      query: this.searchQuery(),
      columnKeys: ['name'],
      list: this.replicationTasks,
    });
  }
}
