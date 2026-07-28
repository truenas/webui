import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, Type, computed, inject, viewChild, signal,
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
  TnTestIdDirective,
  TnTooltipDirective,
  type TnSortEvent,
} from '@truenas/ui-components';
import { kebabCase } from 'lodash-es';
import {
  Observable, filter, switchMap, take, tap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { helptextSnapshotForm } from 'app/helptext/data-protection/snapshot/snapshot-form';
import { ConfirmOptionsWithSecondaryCheckbox, DialogWithSecondaryCheckboxResult } from 'app/interfaces/dialog.interface';
import { PeriodicSnapshotTaskUi } from 'app/interfaces/periodic-snapshot-task.interface';
import { ScheduleDescriptionPipe } from 'app/modules/dates/pipes/schedule-description/schedule-description.pipe';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { relativeDateColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-relative-date/ix-cell-relative-date.component';
import {
  scheduleColumn,
} from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-schedule/ix-cell-schedule.component';
import { stateButtonColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-state-button/ix-cell-state-button.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import {
  IxTableDetailsRowComponent,
} from 'app/modules/ix-table/components/ix-table-details-row/ix-table-details-row.component';
import { TableColumnPickerComponent } from 'app/modules/ix-table/components/table-column-picker/table-column-picker.component';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import { convertStringToId, createTable, mapTnSortToTableSort, toDisplayedColumns } from 'app/modules/ix-table/utils';
import { LoaderService } from 'app/modules/loader/loader.service';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { extractActiveHoursFromCron, scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import {
  TableRelativeDateCellComponent,
} from 'app/modules/tn-table-cells/relative-date-cell/table-relative-date-cell.component';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  TaskStateCellComponent,
} from 'app/pages/data-protection/components/task-state-cell/task-state-cell.component';
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
  providers: [TaskService, StorageService],
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
    TnTestIdDirective,
    TnTooltipDirective,
    TnTablePagerComponent,
    IxTableDetailsRowComponent,
    TableRelativeDateCellComponent,
    TaskStateCellComponent,
    ScheduleDescriptionPipe,
    YesNoPipe,
    TranslateModule,
    AsyncPipe,
  ],
})
export class SnapshotTaskListComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  protected emptyService = inject(EmptyService);
  private dialogService = inject(DialogService);
  private api = inject(ApiService);
  private taskService = inject(TaskService);
  private snapshotTaskService = inject(SnapshotTaskService);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);
  private formPanel = inject(FormSidePanelService);
  private route = inject(ActivatedRoute);
  private loader = inject(LoaderService);

  protected readonly requiredRoles = [Role.SnapshotTaskWrite];
  protected readonly searchableElements = snapshotTaskListElements;

  snapshotTasks: PeriodicSnapshotTaskUi[] = [];
  searchQuery = signal('');
  dataProvider: AsyncDataProvider<PeriodicSnapshotTaskUi>;
  protected readonly EmptyType = EmptyType;

  // ix-table column model retained purely to drive <ix-table-column-picker>
  // (visibility + saved prefs) and the hidden-column list rendered in the detail
  // row; tn-table renders cells from the template and derives its
  // `displayedColumns` from these via `toDisplayedColumns`.
  protected columns = signal(createTable<PeriodicSnapshotTaskUi>([
    textColumn({
      title: this.translate.instant('Pool/Dataset'),
      propertyName: 'dataset',
    }),
    textColumn({
      title: this.translate.instant('Recursive'),
      getValue: (row) => (row.recursive ? this.translate.instant('Yes') : this.translate.instant('No')),
      propertyName: 'recursive',
    }),
    textColumn({
      title: this.translate.instant('Naming Schema'),
      propertyName: 'naming_schema',
    }),
    textColumn({
      title: this.translate.instant('When'),
      propertyName: 'when',
      getValue: (row) => this.getActiveHours(row),
    }),
    scheduleColumn({
      title: this.translate.instant('Frequency'),
      getValue: (row) => row.schedule,
    }),
    relativeDateColumn({
      hidden: true,
      title: this.translate.instant('Next Run'),
      getValue: (task) => this.getNextRun(task),
    }),
    relativeDateColumn({
      title: this.translate.instant('Last Run'),
      hidden: true,
      getValue: (row) => row.state?.datetime?.$date,
    }),
    textColumn({
      title: this.translate.instant('Keep snapshot for'),
      getValue: (row) => this.getLifetime(row),
      propertyName: 'lifetime_unit',
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('Legacy'),
      hidden: true,
      getValue: (row) => (row.legacy ? this.translate.instant('Yes') : this.translate.instant('No')),
      propertyName: 'legacy',
    }),
    textColumn({
      title: this.translate.instant('VMware Sync'),
      hidden: true,
      getValue: (row) => (row.vmware_sync ? this.translate.instant('Yes') : this.translate.instant('No')),
      propertyName: 'vmware_sync',
    }),
    textColumn({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
      getValue: (task) => (task.enabled ? this.translate.instant('Yes') : this.translate.instant('No')),
    }),
    stateButtonColumn({
      title: this.translate.instant('State'),
      getValue: (row) => row.state.state,
    }),
  ], {
    // Still needed: <ix-table-details-row> renders the hidden columns through the
    // ix cell components, which read `uniqueRowTag`/`ariaLabels` off the column.
    uniqueRowTag: (row) => 'snapshot-task-' + row.dataset + '-' + row.naming_schema,
    ariaLabels: (row) => [row.dataset, this.translate.instant('Snapshot Task')],
  }));

  protected readonly displayedColumns = computed<string[]>(() => toDisplayedColumns(this.columns()));

  protected readonly hiddenColumns = computed<
    Column<PeriodicSnapshotTaskUi, ColumnComponent<PeriodicSnapshotTaskUi>>[]
  >(() => this.columns().filter((column) => column?.hidden));

  protected readonly trackByTaskId = (_index: number, row: PeriodicSnapshotTaskUi): number => row.id;

  protected uniqueRowTag(row: PeriodicSnapshotTaskUi): string {
    // Pre-split with lodash kebabCase: it breaks letter–digit boundaries ('pool1' → 'pool-1')
    // while the library's kebab does not, so the tag resolves identically through the legacy
    // [ixTest] directive and the library [tnTestId] directive.
    return kebabCase(convertStringToId('snapshot-task-' + row.dataset + '-' + row.naming_schema));
  }

  protected ariaLabel(row: PeriodicSnapshotTaskUi): string {
    return [row.dataset, this.translate.instant('Snapshot Task')].join(' ');
  }

  protected detailActionTestId(row: PeriodicSnapshotTaskUi, action: string): string {
    return kebabCase([row.dataset, row.naming_schema, action].join('-'));
  }

  protected getActiveHours(row: PeriodicSnapshotTaskUi): string {
    const activeHours = extractActiveHoursFromCron(scheduleToCrontab(row.schedule));
    return this.translate.instant('From {task_begin} to {task_end}', {
      task_begin: activeHours.start,
      task_end: activeHours.end,
    });
  }

  protected getNextRun(row: PeriodicSnapshotTaskUi): unknown {
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
    const tasks$ = this.api.call('pool.snapshottask.query').pipe(
      tap((tasks) => {
        this.snapshotTasks = tasks as PeriodicSnapshotTaskUi[];
      }),
      takeUntilDestroyed(this.destroyRef),
    );

    this.dataProvider = new AsyncDataProvider<PeriodicSnapshotTaskUi>(tasks$ as Observable<PeriodicSnapshotTaskUi[]>);

    this.getSnapshotTasks();

    tasks$.pipe(take(1), takeUntilDestroyed(this.destroyRef)).subscribe(() => this.onListFiltered(this.searchQuery()));

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

  protected columnsChange(columns: ReturnType<typeof this.columns>): void {
    this.columns.set([...columns]);
  }

  private readonly table = viewChild(TnTableComponent<PeriodicSnapshotTaskUi>);

  /**
   * tn-table only expands through its chevron; the ix-table this replaced expanded on a
   * row click too, so drive the expansion from `(rowClick)` to keep that behaviour.
   */
  protected onRowClick(row: PeriodicSnapshotTaskUi): void {
    this.table()?.toggleRowExpansion(row);
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(mapTnSortToTableSort<PeriodicSnapshotTaskUi>(event, this.displayedColumns()));
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
