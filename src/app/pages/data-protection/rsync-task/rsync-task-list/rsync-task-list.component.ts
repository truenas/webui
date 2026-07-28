import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, Type, computed, inject, signal, DestroyRef } from '@angular/core';
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
  TnTestIdDirective,
  TnTooltipDirective,
  type TnSortEvent,
} from '@truenas/ui-components';
import { kebabCase } from 'lodash-es';
import {
  filter, switchMap, tap,
} from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { DisplayableState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { TaskState } from 'app/enums/task-state.enum';
import { RsyncTask } from 'app/interfaces/rsync-task.interface';
import { ScheduleDescriptionPipe } from 'app/modules/dates/pipes/schedule-description/schedule-description.pipe';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { actionsWithMenuColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions-with-menu/ix-cell-actions-with-menu.component';
import { relativeDateColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-relative-date/ix-cell-relative-date.component';
import {
  scheduleColumn,
} from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-schedule/ix-cell-schedule.component';
import {
  stateButtonColumn,
} from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-state-button/ix-cell-state-button.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import {
  yesNoColumn,
} from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-yes-no/ix-cell-yes-no.component';
import { TableColumnPickerComponent } from 'app/modules/ix-table/components/table-column-picker/table-column-picker.component';
import { convertStringToId, createTable, mapTnSortToTableSort, toDisplayedColumns } from 'app/modules/ix-table/utils';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { CrontabExplanationPipe } from 'app/modules/scheduler/pipes/crontab-explanation.pipe';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TableActionsCellComponent } from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import {
  TableRelativeDateCellComponent,
} from 'app/modules/tn-table-cells/relative-date-cell/table-relative-date-cell.component';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  TaskStateCellComponent,
} from 'app/pages/data-protection/components/task-state-cell/task-state-cell.component';
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
    TnTestIdDirective,
    TnTooltipDirective,
    TnTablePagerComponent,
    TableActionsCellComponent,
    TableRelativeDateCellComponent,
    TaskStateCellComponent,
    ScheduleDescriptionPipe,
    YesNoPipe,
    TranslateModule,
    AsyncPipe,
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
  protected emptyService = inject(EmptyService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.SnapshotTaskWrite];
  protected readonly searchableElements = rsyncTaskListElements;
  protected readonly EmptyType = EmptyType;

  dataProvider: AsyncDataProvider<RsyncTask>;
  searchQuery = signal('');

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

  // ix-table column model retained purely to drive <ix-table-column-picker>
  // (visibility + saved prefs); tn-table renders cells from the template and
  // derives its `displayedColumns` from these via `toDisplayedColumns`.
  protected readonly columns = signal(createTable<RsyncTask>([
    textColumn({
      title: this.translate.instant('Path'),
      propertyName: 'path',
    }),
    textColumn({
      title: this.translate.instant('Remote Host'),
      propertyName: 'remotehost',
    }),
    textColumn({
      title: this.translate.instant('Remote SSH Port'),
      propertyName: 'remoteport',
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('Remote Module Name'),
      propertyName: 'remotemodule',
    }),
    textColumn({
      title: this.translate.instant('Remote Path'),
      propertyName: 'remotepath',
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('Direction'),
      propertyName: 'direction',
    }),
    scheduleColumn({
      title: this.translate.instant('Schedule'),
      propertyName: 'schedule',
      hidden: true,
    }),
    // No `propertyName`: it would collide with the Schedule column above on the
    // tn-table column name, and sorting on the raw schedule object was never
    // meaningful. Renders as the derived `frequency` column instead.
    textColumn({
      title: this.translate.instant('Frequency'),
    }),
    relativeDateColumn({
      title: this.translate.instant('Next Run'),
    }),
    relativeDateColumn({
      title: this.translate.instant('Last Run'),
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('Short Description'),
      propertyName: 'desc',
    }),
    textColumn({
      title: this.translate.instant('User'),
      propertyName: 'user',
    }),
    yesNoColumn({
      title: this.translate.instant('Delay Updates'),
      propertyName: 'delayupdates',
      hidden: true,
    }),
    stateButtonColumn({
      title: this.translate.instant('Status'),
    }),
    yesNoColumn({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
    }),
    actionsWithMenuColumn({}),
  ]));

  protected readonly displayedColumns = computed<string[]>(() => toDisplayedColumns(this.columns()));

  protected readonly trackByTaskId = (_index: number, row: RsyncTask): number => row.id;

  protected uniqueRowTag(row: RsyncTask): string {
    // Pre-split with lodash kebabCase: it breaks letter–digit boundaries ('pool1' → 'pool-1')
    // while the library's kebab does not, so the tag resolves identically through the legacy
    // [ixTest] directive and the library [tnTestId] directive.
    return kebabCase(convertStringToId('rsync-task-' + row.path + '-' + row.remotehost));
  }

  protected ariaLabel(row: RsyncTask): string {
    return [row.path, row.remotehost, this.translate.instant('Rsync Task')].join(' ');
  }

  protected getFrequency(row: RsyncTask): string {
    return this.crontabExplanation.transform(scheduleToCrontab(row.schedule));
  }

  protected getNextRun(row: RsyncTask): unknown {
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

    const request$ = this.api.call('rsynctask.query');
    this.dataProvider = new AsyncDataProvider(request$);
    this.refresh();
    this.dataProvider.emptyType$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.onListFiltered(this.searchQuery());
    });
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query);
    this.dataProvider.setFilter({ query, columnKeys: ['path', 'desc'] });
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(mapTnSortToTableSort<RsyncTask>(event, this.displayedColumns()));
  }

  protected columnsChange(columns: ReturnType<typeof this.columns>): void {
    this.columns.set([...columns]);
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
