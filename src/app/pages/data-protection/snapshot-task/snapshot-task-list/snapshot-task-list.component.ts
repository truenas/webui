import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, Type, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent,
  TnCellDefDirective,
  TnDetailRowDefDirective,
  TnEmptyComponent,
  TnHeaderCellDefDirective,
  TnTableColumnDirective,
  TnTableComponent,
  TnTablePagerComponent,
} from '@truenas/ui-components';
import {
  Observable, filter, switchMap, tap,
} from 'rxjs';
import { snapshotTaskEmptyConfig } from 'app/constants/empty-configs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { emptyConfigIcon } from 'app/helpers/empty-config.helper';
import { translated } from 'app/helpers/translated.helper';
import { helptextSnapshotForm } from 'app/helptext/data-protection/snapshot/snapshot-form';
import { ConfirmOptionsWithSecondaryCheckbox, DialogWithSecondaryCheckboxResult } from 'app/interfaces/dialog.interface';
import { PeriodicSnapshotTaskUi } from 'app/interfaces/periodic-snapshot-task.interface';
import { ScheduleDescriptionPipe } from 'app/modules/dates/pipes/schedule-description/schedule-description.pipe';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FlattenEmptyMessagePipe } from 'app/modules/pipes/flatten-empty-message/flatten-empty-message.pipe';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { extractActiveHoursFromCron, scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { AsyncDataProvider } from 'app/modules/tn-table/classes/async-data-provider/async-data-provider';
import { column } from 'app/modules/tn-table/column-configs';
import { TableColumnPickerComponent } from 'app/modules/tn-table/components/table-column-picker/table-column-picker.component';
import {
  TableDetailsRowComponent,
} from 'app/modules/tn-table/components/table-details-row/table-details-row.component';
import { createTable, detailActionTestId, tnTableListHost } from 'app/modules/tn-table/utils';
import { TableRelativeDateCellComponent,
  formatRelativeDateValue } from 'app/modules/tn-table-cells/relative-date-cell/table-relative-date-cell.component';
import {
  formatTaskStateValue, TaskStateCellComponent,
} from 'app/modules/tn-table-cells/state-cell/task-state-cell.component';
import { TableTextCellComponent } from 'app/modules/tn-table-cells/text-cell/table-text-cell.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { SnapshotTaskFormComponent } from 'app/pages/data-protection/snapshot-task/snapshot-task-form/snapshot-task-form.component';
import { snapshotTaskListElements } from 'app/pages/data-protection/snapshot-task/snapshot-task-list/snapshot-task-list.elements';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { SnapshotTaskService } from 'app/services/snapshot-task.service';
import { StorageService } from 'app/services/storage.service';
import { TaskService } from 'app/services/task.service';

@Component({
  selector: 'ix-snapshot-task-list',
  styleUrls: ['./snapshot-task-list.component.scss'],
  templateUrl: './snapshot-task-list.component.html',
  // Both pipes are provided so the column model can inject and call them directly: a details row
  // prints what the cell shows rather than a raw schedule object or an untranslated state code.
  // `ScheduleDescriptionPipe` is imported too, because the template also pipes through it.
  providers: [TaskService, StorageService, ScheduleDescriptionPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    BasicSearchComponent,
    TnButtonComponent,
    RouterLink,
    TableColumnPickerComponent,
    RequiresRolesDirective,
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
    TaskStateCellComponent,
    ScheduleDescriptionPipe,
    YesNoPipe,
    FlattenEmptyMessagePipe,
    TranslateModule,
  ],
})
export class SnapshotTaskListComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private dialogService = inject(DialogService);
  private api = inject(ApiService);
  private taskService = inject(TaskService);
  private snapshotTaskService = inject(SnapshotTaskService);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);
  private formPanel = inject(FormSidePanelService);
  private route = inject(ActivatedRoute);
  private loader = inject(LoaderService);
  private scheduleDescription = inject(ScheduleDescriptionPipe);

  protected readonly requiredRoles = [Role.SnapshotTaskWrite];
  protected readonly searchableElements = snapshotTaskListElements;

  private snapshotTasks: PeriodicSnapshotTaskUi[] = [];
  protected readonly searchQuery = signal('');

  private readonly tasks$ = this.api.call('pool.snapshottask.query').pipe(
    tap((tasks) => {
      this.snapshotTasks = tasks as PeriodicSnapshotTaskUi[];
    }),
    takeUntilDestroyed(),
  ) as Observable<PeriodicSnapshotTaskUi[]>;

  readonly dataProvider = new AsyncDataProvider<PeriodicSnapshotTaskUi>(this.tasks$);
  protected readonly EmptyType = EmptyType;

  // Bound from the shared catalog config rather than inlined in the template, so the
  // translated string has a single source of truth and follows a language change.
  protected readonly emptyConfig = snapshotTaskEmptyConfig;
  protected readonly emptyIcon = emptyConfigIcon(snapshotTaskEmptyConfig);

  // One source of truth per column title: the header, the cell (whose test id is built
  // from it) and the column model all read the same entry, so a rename cannot silently
  // change a data-test value. `translated` re-runs it on a language change — and because
  // the column model is passed as a factory, the picker and detail row re-read it too.
  protected readonly titles = translated(() => ({
    poolDataset: this.translate.instant('Pool/Dataset'),
    recursive: this.translate.instant('Recursive'),
    namingSchema: this.translate.instant('Naming Schema'),
    when: this.translate.instant('When'),
    frequency: this.translate.instant('Frequency'),
    nextRun: this.translate.instant('Next Run'),
    lastRun: this.translate.instant('Last Run'),
    keepSnapshotFor: this.translate.instant('Keep snapshot for'),
    legacy: this.translate.instant('Legacy'),
    vmwareSync: this.translate.instant('VMware Sync'),
    enabled: this.translate.instant('Enabled'),
    state: this.translate.instant('State'),
  }));

  protected readonly list = tnTableListHost<PeriodicSnapshotTaskUi>(this.dataProvider, {
    columns: () => createTable<PeriodicSnapshotTaskUi>([
      column({
        title: this.titles().poolDataset,
        propertyName: 'dataset',
      }),
      column({
        title: this.titles().recursive,
        getValue: (row) => (row.recursive ? this.translate.instant('Yes') : this.translate.instant('No')),
        propertyName: 'recursive',
      }),
      column({
        title: this.titles().namingSchema,
        propertyName: 'naming_schema',
      }),
      column({
        title: this.titles().when,
        propertyName: 'when',
        getValue: (row) => this.activeHours(row),
      }),
      column({
        title: this.titles().frequency,
        columnName: 'frequency',
        getValue: (row) => row.schedule,
        // The table shows this through <ix-table-text-cell>; a details row prints it, under the
        // id that cell resolves.
        formatValue: (row) => this.scheduleDescription.transform(row.schedule),
        testIdSuffix: 'row-schedule',
      }),
      column({
        hidden: true,
        title: this.titles().nextRun,
        columnName: 'next-run',
        getValue: (task) => this.getNextRun(task),
        // The table shows this through <ix-table-relative-date-cell>; a details row prints it,
        // under the id that cell resolves.
        formatValue: (task) => formatRelativeDateValue(this.getNextRun(task), this.translate),
        testIdSuffix: 'row-relative-date',
      }),
      column({
        title: this.titles().lastRun,
        columnName: 'last-run',
        hidden: true,
        getValue: (row) => row.state?.datetime?.$date,
        // The table shows this through <ix-table-relative-date-cell>; a details row prints it,
        // under the id that cell resolves.
        formatValue: (row) => formatRelativeDateValue(row.state?.datetime?.$date, this.translate),
        testIdSuffix: 'row-relative-date',
      }),
      column({
        title: this.titles().keepSnapshotFor,
        getValue: (row) => this.getLifetime(row),
        propertyName: 'lifetime_unit',
        hidden: true,
      }),
      column({
        title: this.titles().legacy,
        hidden: true,
        getValue: (row) => (row.legacy ? this.translate.instant('Yes') : this.translate.instant('No')),
        propertyName: 'legacy',
      }),
      column({
        title: this.titles().vmwareSync,
        hidden: true,
        getValue: (row) => (row.vmware_sync ? this.translate.instant('Yes') : this.translate.instant('No')),
        propertyName: 'vmware_sync',
      }),
      column({
        title: this.titles().enabled,
        propertyName: 'enabled',
        getValue: (task) => (task.enabled ? this.translate.instant('Yes') : this.translate.instant('No')),
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
    ]),
  });


  protected readonly trackByTaskId = (_index: number, row: PeriodicSnapshotTaskUi): number => row.id;

  protected readonly uniqueRowTag = this.list.rowTag(
    (row) => 'snapshot-task-' + row.dataset + '-' + row.naming_schema,
  );

  protected readonly ariaLabel = this.list.perRow(
    (row) => [row.dataset, this.translate.instant('Snapshot Task')].join(' '),
  );

  protected detailActionTestId(row: PeriodicSnapshotTaskUi, action: string): string {
    return detailActionTestId([row.dataset, row.naming_schema], action);
  }

  // Memoized for the table, where it is asked for once per row per change-detection pass;
  // the detail row renders one row at a time and calls `activeHours` directly, which also
  // keeps the column model from depending on `list` while `list` is still being built.
  protected readonly getActiveHours = this.list.perRow((row: PeriodicSnapshotTaskUi) => this.activeHours(row));

  private activeHours(row: PeriodicSnapshotTaskUi): string {
    const activeHours = extractActiveHoursFromCron(scheduleToCrontab(row.schedule));
    return this.translate.instant('From {task_begin} to {task_end}', {
      task_begin: activeHours.start,
      task_end: activeHours.end,
    });
  }

  // Not memoized per row like the derivations above: the next occurrence is relative
  // to now, so it has to be recomputed as the table renders.
  protected getNextRun(row: PeriodicSnapshotTaskUi): Date | string {
    if (row.enabled) {
      return this.taskService.getTaskNextTime(scheduleToCrontab(row.schedule));
    }
    return this.translate.instant('Disabled');
  }

  protected getLifetime(row: PeriodicSnapshotTaskUi): string {
    return `${row.lifetime_value} ${row.lifetime_unit}(S)`.toLowerCase();
  }

  constructor() {
    this.searchQuery.set(this.route.snapshot.paramMap.get('dataset') || '');
  }

  ngOnInit(): void {
    this.getSnapshotTasks();

    this.dataProvider.emptyType$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.onListFiltered(this.searchQuery());
    });

    this.api.subscribe('pool.snapshottask.query').pipe(
      tap(() => this.getSnapshotTasks()),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }

  protected getSnapshotTasks(): void {
    this.dataProvider.load();
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query);
    this.dataProvider.setFilter({ list: this.snapshotTasks, query, columnKeys: ['dataset', 'naming_schema'] });
  }

  // SnapshotTaskFormComponent structurally provides the host surface (closed/canSubmit/submit/
  // hasUnsavedChanges/requiredRoles) the panel reads; cast past the nominal base type.
  private readonly snapshotTaskForm = SnapshotTaskFormComponent as unknown as Type<SidePanelForm>;

  protected doAdd(): void {
    this.formPanel.open(this.snapshotTaskForm, {
      title: this.translate.instant('Add Periodic Snapshot Task'),
      wide: true,
    }).onSuccess(() => this.getSnapshotTasks(), this.destroyRef);
  }

  protected doEdit(row: PeriodicSnapshotTaskUi): void {
    this.formPanel.open(this.snapshotTaskForm, {
      title: this.translate.instant('Edit Periodic Snapshot Task'),
      wide: true,
      inputs: { taskToEdit: row },
    }).onSuccess(() => this.getSnapshotTasks(), this.destroyRef);
  }

  protected doDelete(snapshotTask: PeriodicSnapshotTaskUi): void {
    this.snapshotTaskService.checkTaskHasSnapshots(snapshotTask.id).pipe(
      this.loader.withLoader(),
      switchMap((hasSnapshots) => this.confirmDelete(snapshotTask, hasSnapshots)),
      filter((result) => result.confirmed),
      switchMap((result) => this.deleteTask(snapshotTask.id, result.secondaryCheckbox)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.getSnapshotTasks();
      },
      error: (error: unknown) => {
        this.errorHandler.showErrorModal(error);
      },
    });
  }

  private confirmDelete(
    task: PeriodicSnapshotTaskUi,
    hasSnapshots: boolean,
  ): Observable<DialogWithSecondaryCheckboxResult> {
    const confirmOptions: ConfirmOptionsWithSecondaryCheckbox = {
      title: this.translate.instant('Confirmation'),
      message: this.translate.instant('Delete Periodic Snapshot Task <b>"{value}"</b>?', {
        value: `${task.dataset} - ${task.naming_schema}`,
      }),
      buttonColor: 'warn',
      buttonText: this.translate.instant('Delete'),
      secondaryCheckbox: hasSnapshots,
      secondaryCheckboxText: this.translate.instant(helptextSnapshotForm.keepSnapshotsLabel),
    };

    // TypeScript can't discriminate overloads when using extends, explicit cast needed
    return this.dialogService.confirm(confirmOptions) as unknown as Observable<DialogWithSecondaryCheckboxResult>;
  }

  private deleteTask(taskId: number, fixateRemovalDate: boolean): Observable<boolean> {
    return this.api.call('pool.snapshottask.delete', [taskId, { fixate_removal_date: fixateRemovalDate }]).pipe(
      this.loader.withLoader(),
    );
  }
}
