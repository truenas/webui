import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  filter, map, switchMap, tap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { relativeDateColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-relative-date/ix-cell-relative-date.component';
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
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { CronDeleteDialog } from 'app/pages/system/advanced/cron/cron-delete-dialog/cron-delete-dialog.component';
import { CronFormComponent } from 'app/pages/system/advanced/cron/cron-form/cron-form.component';
import { cronElements } from 'app/pages/system/advanced/cron/cron-list/cron-list.elements';
import { CronjobRow } from 'app/pages/system/advanced/cron/cron-list/cronjob-row.interface';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { TaskService } from 'app/services/task.service';

@UntilDestroy()
@Component({
  selector: 'ix-cron-list',
  templateUrl: './cron-list.component.html',
  styleUrls: ['./cron-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    BasicSearchComponent,
    IxTableColumnsSelectorComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    IxTableComponent,
    IxTableEmptyDirective,
    UiSearchDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTableDetailsRowDirective,
    IxTableDetailsRowComponent,
    IxTablePagerComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class CronListComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private taskService = inject(TaskService);
  private dialog = inject(DialogService);
  private errorHandler = inject(ErrorHandlerService);
  private slideIn = inject(SlideIn);
  private matDialog = inject(MatDialog);
  protected emptyService = inject(EmptyService);

  protected readonly requiredRoles = [Role.SystemCronWrite];
  protected readonly searchableElements = cronElements;

  cronjobs: CronjobRow[] = [];
  searchQuery = signal('');
  dataProvider: AsyncDataProvider<CronjobRow>;
  columns = createTable<CronjobRow>([
    textColumn({
      title: this.translate.instant('Users'),
      propertyName: 'user',
    }),
    textColumn({
      title: this.translate.instant('Command'),
      propertyName: 'command',
    }),
    textColumn({
      title: this.translate.instant('Description'),
      propertyName: 'description',
    }),
    textColumn({
      title: this.translate.instant('Schedule'),
      propertyName: 'schedule',
      getValue: (task) => (task.enabled ? scheduleToCrontab(task.schedule) : this.translate.instant('Disabled')),
    }),
    textColumn({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
      getValue: (task) => (task.enabled ? this.translate.instant('Yes') : this.translate.instant('No')),
    }),
    relativeDateColumn({
      title: this.translate.instant('Next Run'),
      hidden: true,
      getValue: (task) => {
        if (task.enabled) {
          return this.taskService.getTaskNextTime(scheduleToCrontab(task.schedule));
        }
        return this.translate.instant('Disabled');
      },
    }),
    textColumn({
      title: this.translate.instant('Hide Stdout'),
      propertyName: 'stdout',
      getValue: (task) => (task.stdout ? this.translate.instant('Yes') : this.translate.instant('No')),
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('Hide Stderr'),
      propertyName: 'stderr',
      getValue: (task) => (task.stderr ? this.translate.instant('Yes') : this.translate.instant('No')),
      hidden: true,
    }),
  ], {
    uniqueRowTag: (row) => 'cron-' + row.command + '-' + row.description,
    ariaLabels: (row) => [row.command, this.translate.instant('Cron Job')],
  });

  protected get hiddenColumns(): Column<CronjobRow, ColumnComponent<CronjobRow>>[] {
    return this.columns.filter((column) => column?.hidden);
  }

  ngOnInit(): void {
    const cronjobs$ = this.api.call('cronjob.query').pipe(
      map((cronjobs) => {
        return cronjobs.map((job): CronjobRow => ({
          ...job,
          next_run: this.taskService.getTaskNextRun(scheduleToCrontab(job.schedule)),
        }));
      }),
      tap((cronjobs) => this.cronjobs = cronjobs),
      untilDestroyed(this),
    );
    this.dataProvider = new AsyncDataProvider<CronjobRow>(cronjobs$);
    this.getCronJobs();
    this.dataProvider.emptyType$.pipe(untilDestroyed(this)).subscribe(() => {
      this.onListFiltered(this.searchQuery());
    });
  }

  protected getCronJobs(): void {
    this.dataProvider.load();
  }

  protected doAdd(): void {
    this.slideIn.open(CronFormComponent)
      .pipe(filter((response) => !!response.response), untilDestroyed(this))
      .subscribe(() => {
        this.getCronJobs();
      });
  }

  protected doEdit(row: CronjobRow): void {
    this.slideIn.open(CronFormComponent, { data: row })
      .pipe(filter((response) => !!response.response), untilDestroyed(this))
      .subscribe(() => {
        this.getCronJobs();
      });
  }

  protected runNow(row: CronjobRow): void {
    this.dialog.confirm({
      message: this.translate.instant('Run this job now?'),
      hideCheckbox: true,
    }).pipe(
      filter(Boolean),
      switchMap(() => this.api.call('cronjob.run', [row.id])),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        const message = row.enabled
          ? this.translate.instant('This job is scheduled to run again {nextRun}.', { nextRun: row.next_run })
          : this.translate.instant('This job will not run again until it is enabled.');
        this.dialog.info(
          this.translate.instant('Job {job} Completed Successfully', { job: row.description }),
          message,
        );
      },
      error: (error: unknown) => this.errorHandler.showErrorModal(error),
    });
  }

  protected doDelete(row: CronjobRow): void {
    this.matDialog.open(CronDeleteDialog, {
      data: row,
    }).afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        this.getCronJobs();
      });
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query);
    this.dataProvider.setFilter({ query, columnKeys: ['user'] });
  }

  protected columnsChange(columns: typeof this.columns): void {
    this.columns = [...columns];
    this.cdr.detectChanges();
    this.cdr.markForCheck();
  }
}
