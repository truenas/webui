import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  Observable, filter, switchMap, take, tap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { PeriodicSnapshotTaskUi } from 'app/interfaces/periodic-snapshot-task.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { relativeDateColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-relative-date/ix-cell-relative-date.component';
import { stateButtonColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-state-button/ix-cell-state-button.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableColumnsSelectorComponent } from 'app/modules/ix-table/components/ix-table-columns-selector/ix-table-columns-selector.component';
import { IxTableDetailsRowComponent } from 'app/modules/ix-table/components/ix-table-details-row/ix-table-details-row.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableDetailsRowDirective } from 'app/modules/ix-table/directives/ix-table-details-row.directive';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import { createTable } from 'app/modules/ix-table/utils';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { extractActiveHoursFromCron, scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { SnapshotTaskFormComponent } from 'app/pages/data-protection/snapshot-task/snapshot-task-form/snapshot-task-form.component';
import { snapshotTaskListElements } from 'app/pages/data-protection/snapshot-task/snapshot-task-list/snapshot-task-list.elements';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { SlideInService } from 'app/services/slide-in.service';
import { StorageService } from 'app/services/storage.service';
import { TaskService } from 'app/services/task.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-snapshot-task-list',
  styleUrls: ['./snapshot-task-list.component.scss'],
  templateUrl: './snapshot-task-list.component.html',
  providers: [TaskService, StorageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    PageHeaderComponent,
    SearchInput1Component,
    MatButton,
    TestDirective,
    RouterLink,
    IxTableColumnsSelectorComponent,
    RequiresRolesDirective,
    UiSearchDirective,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTableDetailsRowDirective,
    IxTableDetailsRowComponent,
    IxIconComponent,
    IxTablePagerComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class SnapshotTaskListComponent implements OnInit {
  readonly requiredRoles = [Role.SnapshotTaskWrite];
  protected readonly searchableElements = snapshotTaskListElements;

  snapshotTasks: PeriodicSnapshotTaskUi[] = [];
  filterString = '';
  dataProvider: AsyncDataProvider<PeriodicSnapshotTaskUi>;

  protected columns = createTable<PeriodicSnapshotTaskUi>([
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
      getValue: (row) => {
        const cronSchedule = scheduleToCrontab(row.schedule);
        const activeHours = extractActiveHoursFromCron(cronSchedule);
        return this.translate.instant('From {task_begin} to {task_end}', {
          task_begin: activeHours.start,
          task_end: activeHours.end,
        });
      },
    }),
    textColumn({
      title: this.translate.instant('Frequency'),
      propertyName: 'frequency',
      getValue: (row) => this.taskService.getTaskCronDescription(scheduleToCrontab(row.schedule)),
    }),
    relativeDateColumn({
      hidden: true,
      title: this.translate.instant('Next Run'),
      getValue: (task) => {
        if (task.enabled) {
          return this.taskService.getTaskNextTime(scheduleToCrontab(task.schedule));
        }
        return this.translate.instant('Disabled');
      },
    }),
    relativeDateColumn({
      title: this.translate.instant('Last Run'),
      hidden: true,
      getValue: (row) => row.state?.datetime?.$date,
    }),
    textColumn({
      title: this.translate.instant('Keep snapshot for'),
      getValue: (row) => `${row.lifetime_value} ${row.lifetime_unit}(S)`.toLowerCase(),
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
      cssClass: 'state-button',
    }),
  ], {
    uniqueRowTag: (row) => 'snapshot-task-' + row.dataset + '-' + row.naming_schema,
    ariaLabels: (row) => [row.dataset, this.translate.instant('Snapshot Task')],
  });

  get emptyConfigService(): EmptyService {
    return this.emptyService;
  }

  get hiddenColumns(): Column<PeriodicSnapshotTaskUi, ColumnComponent<PeriodicSnapshotTaskUi>>[] {
    return this.columns.filter((column) => column?.hidden);
  }

  constructor(
    protected emptyService: EmptyService,
    private dialogService: DialogService,
    private ws: WebSocketService,
    private taskService: TaskService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private slideInService: SlideInService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {
    this.filterString = this.route.snapshot.paramMap.get('dataset') || '';
  }

  ngOnInit(): void {
    const tasks$ = this.ws.call('pool.snapshottask.query').pipe(
      tap((tasks) => {
        this.snapshotTasks = tasks as PeriodicSnapshotTaskUi[];
      }),
      untilDestroyed(this),
    );

    this.dataProvider = new AsyncDataProvider<PeriodicSnapshotTaskUi>(tasks$ as Observable<PeriodicSnapshotTaskUi[]>);

    this.getSnapshotTasks();

    tasks$.pipe(take(1), untilDestroyed(this)).subscribe(() => this.onListFiltered(this.filterString));

    this.dataProvider.emptyType$.pipe(untilDestroyed(this)).subscribe(() => {
      this.onListFiltered(this.filterString);
    });
  }

  getSnapshotTasks(): void {
    this.dataProvider.load();
  }

  columnsChange(columns: typeof this.columns): void {
    this.columns = [...columns];
    this.cdr.detectChanges();
    this.cdr.markForCheck();
  }

  onListFiltered(query: string): void {
    this.filterString = query;
    this.dataProvider.setFilter({ list: this.snapshotTasks, query, columnKeys: ['dataset', 'naming_schema'] });
  }

  doAdd(): void {
    const slideInRef = this.slideInService.open(SnapshotTaskFormComponent, { wide: true });
    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => this.getSnapshotTasks());
  }

  doEdit(row: PeriodicSnapshotTaskUi): void {
    const slideInRef = this.slideInService.open(SnapshotTaskFormComponent, { wide: true, data: row });
    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => this.getSnapshotTasks());
  }

  doDelete(snapshotTask: PeriodicSnapshotTaskUi): void {
    this.dialogService.confirm({
      title: this.translate.instant('Confirmation'),
      message: this.translate.instant('Delete Periodic Snapshot Task <b>"{value}"</b>?', {
        value: `${snapshotTask.dataset} - ${snapshotTask.naming_schema}`,
      }),
    }).pipe(
      filter(Boolean),
      switchMap(() => this.ws.call('pool.snapshottask.delete', [snapshotTask.id])),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.getSnapshotTasks();
      },
      error: (err) => {
        this.dialogService.error(this.errorHandler.parseError(err));
      },
    });
  }
}
