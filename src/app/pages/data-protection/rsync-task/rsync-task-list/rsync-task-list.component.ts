import { ChangeDetectionStrategy, Component, OnInit, Type, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  tnIconMarker,
  TnButtonComponent,
  TnCellDefDirective,
  TnEmptyComponent,
  TnHeaderCellDefDirective,
  TnTableColumnDirective,
  TnTableComponent,
  TnTablePagerComponent,
} from '@truenas/ui-components';
import {
  filter, switchMap, tap,
} from 'rxjs/operators';
import { rsyncTaskEmptyConfig } from 'app/constants/empty-configs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { DisplayableState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { TaskState } from 'app/enums/task-state.enum';
import { emptyConfigIcon } from 'app/helpers/empty-config.helper';
import { translated } from 'app/helpers/translated.helper';
import { RsyncTask } from 'app/interfaces/rsync-task.interface';
import { ScheduleDescriptionPipe } from 'app/modules/dates/pipes/schedule-description/schedule-description.pipe';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FlattenEmptyMessagePipe } from 'app/modules/pipes/flatten-empty-message/flatten-empty-message.pipe';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { CrontabExplanationPipe } from 'app/modules/scheduler/pipes/crontab-explanation.pipe';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { AsyncDataProvider } from 'app/modules/tn-table/classes/async-data-provider/async-data-provider';
import { column } from 'app/modules/tn-table/column-configs';
import { TableColumnPickerComponent } from 'app/modules/tn-table/components/table-column-picker/table-column-picker.component';
import { IconActionConfig } from 'app/modules/tn-table/interfaces/icon-action-config.interface';
import { createTable, tnTableListHost } from 'app/modules/tn-table/utils';
import { TableActionsCellComponent } from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import {
  TableRelativeDateCellComponent,
} from 'app/modules/tn-table-cells/relative-date-cell/table-relative-date-cell.component';
import {
  TaskStateCellComponent,
} from 'app/modules/tn-table-cells/state-cell/task-state-cell.component';
import { TableTextCellComponent } from 'app/modules/tn-table-cells/text-cell/table-text-cell.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { RsyncTaskFormComponent } from 'app/pages/data-protection/rsync-task/rsync-task-form/rsync-task-form.component';
import { rsyncTaskListElements } from 'app/pages/data-protection/rsync-task/rsync-task-list/rsync-task-list.elements';
import { TaskService } from 'app/services/task.service';

@Component({
  selector: 'ix-rsync-task-list',
  templateUrl: './rsync-task-list.component.html',
  styleUrls: ['./rsync-task-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CrontabExplanationPipe],
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
    TnTablePagerComponent,
    TableActionsCellComponent,
    TableRelativeDateCellComponent,
    TableTextCellComponent,
    TaskStateCellComponent,
    ScheduleDescriptionPipe,
    YesNoPipe,
    FlattenEmptyMessagePipe,
    TranslateModule,
  ],
})
export class RsyncTaskListComponent implements OnInit {
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  private formPanel = inject(FormSidePanelService);
  private dialogService = inject(DialogService);
  private crontabExplanation = inject(CrontabExplanationPipe);
  private taskService = inject(TaskService);
  private snackbar = inject(SnackbarService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.SnapshotTaskWrite];
  protected readonly searchableElements = rsyncTaskListElements;
  protected readonly EmptyType = EmptyType;

  protected readonly searchQuery = signal('');

  private readonly rsyncTasks$ = this.api.call('rsynctask.query');

  readonly dataProvider = new AsyncDataProvider<RsyncTask>(this.rsyncTasks$);

  // Bound from the shared catalog config rather than inlined in the template, so the
  // translated string has a single source of truth and follows a language change.
  protected readonly emptyConfig = rsyncTaskEmptyConfig;
  protected readonly emptyIcon = emptyConfigIcon(rsyncTaskEmptyConfig);

  protected readonly actions: IconActionConfig<RsyncTask>[] = [
    {
      iconName: tnIconMarker('play-circle', 'mdi'),
      tooltip: this.translate.instant('Run job'),
      requiredRoles: this.requiredRoles,
      onClick: (row) => this.runNow(row),
    },
    {
      iconName: tnIconMarker('pencil', 'mdi'),
      tooltip: this.translate.instant('Edit'),
      onClick: (row) => this.edit(row),
    },
    {
      iconName: tnIconMarker('delete', 'mdi'),
      tooltip: this.translate.instant('Delete'),
      requiredRoles: this.requiredRoles,
      onClick: (row) => this.delete(row),
    },
  ];

  // One source of truth per column title: the header, the cell (whose test id is built
  // from it) and the column model all read the same entry, so a rename cannot silently
  // change a data-test value. `translated` re-runs it on a language change — and because
  // the column model is passed as a factory, the picker and detail row re-read it too.
  protected readonly titles = translated(() => ({
    path: this.translate.instant('Path'),
    remoteHost: this.translate.instant('Remote Host'),
    remoteSshPort: this.translate.instant('Remote SSH Port'),
    remoteModuleName: this.translate.instant('Remote Module Name'),
    remotePath: this.translate.instant('Remote Path'),
    direction: this.translate.instant('Direction'),
    schedule: this.translate.instant('Schedule'),
    frequency: this.translate.instant('Frequency'),
    nextRun: this.translate.instant('Next Run'),
    lastRun: this.translate.instant('Last Run'),
    shortDescription: this.translate.instant('Short Description'),
    user: this.translate.instant('User'),
    delayUpdates: this.translate.instant('Delay Updates'),
    status: this.translate.instant('Status'),
    enabled: this.translate.instant('Enabled'),
  }));

  protected readonly list = tnTableListHost<RsyncTask>(this.dataProvider, {
    columns: () => createTable<RsyncTask>([
      column({
        title: this.titles().path,
        propertyName: 'path',
      }),
      column({
        title: this.titles().remoteHost,
        propertyName: 'remotehost',
      }),
      column({
        title: this.titles().remoteSshPort,
        propertyName: 'remoteport',
        hidden: true,
      }),
      column({
        title: this.titles().remoteModuleName,
        propertyName: 'remotemodule',
      }),
      column({
        title: this.titles().remotePath,
        propertyName: 'remotepath',
        hidden: true,
      }),
      column({
        title: this.titles().direction,
        propertyName: 'direction',
      }),
      column({
        title: this.titles().schedule,
        propertyName: 'schedule',
        hidden: true,
      }),
      // No `propertyName`: it would collide with the Schedule column above on the
      // tn-table column name. Renders — and sorts — as the derived `frequency` column.
      column({
        title: this.titles().frequency,
        columnName: 'frequency',
        getValue: (row) => this.getFrequency(row),
      }),
      column({
        title: this.titles().nextRun,
        columnName: 'next-run',
        getValue: (row) => this.getNextRun(row),
      }),
      column({
        title: this.titles().lastRun,
        columnName: 'last-run',
        getValue: (row) => row.job?.time_finished?.$date,
        hidden: true,
      }),
      column({
        title: this.titles().shortDescription,
        propertyName: 'desc',
      }),
      column({
        title: this.titles().user,
        propertyName: 'user',
      }),
      column({
        title: this.titles().delayUpdates,
        propertyName: 'delayupdates',
        hidden: true,
      }),
      column({
        title: this.titles().status,
        columnName: 'status',
        getValue: (row) => this.getTaskState(row),
      }),
      column({
        title: this.titles().enabled,
        propertyName: 'enabled',
      }),
    ]),
    // The actions column is appended rather than modelled: it is rendered from the
    // template by <ix-table-actions-cell>, the picker must never offer it, and a
    // column entry with no cell component behind it would misdescribe the table.
    appendedColumns: ['actions'],
  });

  protected readonly trackByTaskId = (_index: number, row: RsyncTask): number => row.id;

  protected readonly uniqueRowTag = this.list.rowTag(
    (row) => 'rsync-task-' + row.path + '-' + row.remotehost,
  );

  protected readonly ariaLabel = this.list.perRow(
    (row) => [row.path, row.remotehost, this.translate.instant('Rsync Task')].join(' '),
  );

  // Annotated rather than inferred: the column model above calls `getFrequency` from a
  // `getValue`, so inferring its type from `this.list` would be circular.
  protected readonly getFrequency: (row: RsyncTask) => string = this.list.perRow(
    (row) => this.crontabExplanation.transform(scheduleToCrontab(row.schedule)),
  );

  // Not memoized per row like the derivations above: the next occurrence is relative
  // to now, so it has to be recomputed as the table renders.
  protected getNextRun(row: RsyncTask): Date | string {
    return row.enabled
      ? this.taskService.getTaskNextTime(scheduleToCrontab(row.schedule))
      : this.translate.instant('Disabled');
  }

  protected getTaskState(row: RsyncTask): DisplayableState {
    if (!row.job) {
      return row.locked ? TaskState.Locked : TaskState.Pending;
    }

    return row.job.state;
  }

  ngOnInit(): void {
    this.searchQuery.set(this.route.snapshot.paramMap.get('dataset') || '');

    this.refresh();
    this.dataProvider.emptyType$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.onListFiltered(this.searchQuery());
    });
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query);
    this.dataProvider.setFilter({ query, columnKeys: ['path', 'desc'] });
  }

  protected runNow(row: RsyncTask): void {
    this.dialogService.confirm({
      title: this.translate.instant('Run Now'),
      message: this.translate.instant('Run «{name}» Rsync now?', {
        name: `${row.remotehost || row.path} ${row.remotemodule ? '- ' + row.remotemodule : ''}`,
      }),
      hideCheckbox: true,
    })
      .pipe(
        filter(Boolean),
        tap(() => {
          this.snackbar.success(
            this.translate.instant('Rsync task has started.'),
          );
        }),
        switchMap(() => this.api.job('rsynctask.run', [row.id])),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.refresh());
  }

  // RsyncTaskFormComponent structurally provides the host surface (closed/canSubmit/submit/
  // hasUnsavedChanges/requiredRoles) the panel reads; cast past the nominal base type.
  private readonly rsyncTaskForm = RsyncTaskFormComponent as unknown as Type<SidePanelForm>;

  protected add(): void {
    this.formPanel.open(this.rsyncTaskForm, { title: this.translate.instant('Add Rsync Task'), wide: true })
      .onSuccess(() => this.refresh(), this.destroyRef);
  }

  protected edit(row: RsyncTask): void {
    this.formPanel.open(this.rsyncTaskForm, {
      title: this.translate.instant('Edit Rsync Task'),
      wide: true,
      inputs: { taskToEdit: row },
    }).onSuccess(() => this.refresh(), this.destroyRef);
  }

  protected delete(row: RsyncTask): void {
    this.dialogService.confirmDelete({
      title: this.translate.instant('Delete Task'),
      message: this.translate.instant('Are you sure you want to delete this task?'),
      call: () => this.api.call('rsynctask.delete', [row.id]),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.refresh());
  }

  protected refresh(): void {
    this.dataProvider.load();
  }
}
