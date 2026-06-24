import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal, viewChild,
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
  TnSidePanelActionDirective,
  TnSidePanelComponent,
  TnSortEvent,
  TnTableColumnDirective,
  TnTableComponent,
  TnTablePagerComponent,
} from '@truenas/ui-components';
import { isValid } from 'date-fns';
import {
  filter, map, switchMap, tap, Observable, of,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { formatDistanceToNowShortened } from 'app/helpers/format-distance-to-now-shortened';
import { ScheduleDescriptionPipe } from 'app/modules/dates/pipes/schedule-description/schedule-description.pipe';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { mapTnSortToTableSort } from 'app/modules/ix-table/utils';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { CronDeleteDialog } from 'app/pages/system/advanced/cron/cron-delete-dialog/cron-delete-dialog.component';
import { CronFormComponent } from 'app/pages/system/advanced/cron/cron-form/cron-form.component';
import { cronElements } from 'app/pages/system/advanced/cron/cron-list/cron-list.elements';
import { CronjobRow } from 'app/pages/system/advanced/cron/cron-list/cronjob-row.interface';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { TaskService } from 'app/services/task.service';

@Component({
  selector: 'ix-cron-list',
  templateUrl: './cron-list.component.html',
  styleUrls: ['./cron-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    BasicSearchComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    UiSearchDirective,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnDetailRowDefDirective,
    TnEmptyComponent,
    TnSidePanelComponent,
    TnSidePanelActionDirective,
    TnTablePagerComponent,
    CronFormComponent,
    TranslateModule,
    AsyncPipe,
    YesNoPipe,
    ScheduleDescriptionPipe,
  ],
})
export class CronListComponent implements OnInit {
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private taskService = inject(TaskService);
  private dialog = inject(DialogService);
  private errorHandler = inject(ErrorHandlerService);
  private tnDialog = inject(TnDialog);
  private unsavedChanges = inject(UnsavedChangesService);
  protected emptyService = inject(EmptyService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.SystemCronWrite];
  protected readonly searchableElements = cronElements;

  cronjobs: CronjobRow[] = [];
  searchQuery = signal('');
  dataProvider: AsyncDataProvider<CronjobRow>;

  protected configOpen = signal(false);
  protected editingCronjob = signal<CronjobRow | undefined>(undefined);
  protected configForm = viewChild(CronFormComponent);

  protected readonly panelTitle = computed(() => (
    this.editingCronjob()
      ? this.translate.instant('Edit Cron Job')
      : this.translate.instant('Add Cron Job')
  ));

  protected readonly displayedColumns = ['user', 'command', 'description', 'schedule', 'enabled', 'next_run'];

  protected readonly trackBy = (_: number, row: CronjobRow): number => row.id;

  protected readonly closeGuard = (): Observable<boolean> => {
    return this.configForm()?.hasUnsavedChanges()
      ? this.unsavedChanges.showConfirmDialog()
      : of(true);
  };

  protected getNextRun(row: CronjobRow): string {
    if (!row.enabled) {
      return this.translate.instant('Disabled');
    }
    const nextRun = this.taskService.getTaskNextTime(scheduleToCrontab(row.schedule));
    return isValid(nextRun) ? formatDistanceToNowShortened(nextRun as Date) : (nextRun as string);
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
      takeUntilDestroyed(this.destroyRef),
    );
    this.dataProvider = new AsyncDataProvider<CronjobRow>(cronjobs$);
    this.getCronJobs();
    this.dataProvider.emptyType$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.onListFiltered(this.searchQuery());
    });
  }

  protected getCronJobs(): void {
    this.dataProvider.load();
  }

  protected doAdd(): void {
    this.editingCronjob.set(undefined);
    this.configOpen.set(true);
  }

  protected doEdit(row: CronjobRow): void {
    this.editingCronjob.set(row);
    this.configOpen.set(true);
  }

  protected runNow(row: CronjobRow): void {
    this.dialog.confirm({
      message: this.translate.instant('Run this job now?'),
      hideCheckbox: true,
    }).pipe(
      filter(Boolean),
      switchMap(() => this.api.call('cronjob.run', [row.id])),
      takeUntilDestroyed(this.destroyRef),
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
    this.tnDialog.open(CronDeleteDialog, {
      data: row,
    }).closed
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.getCronJobs();
      });
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query);
    this.dataProvider.setFilter({ query, columnKeys: ['user'] });
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(mapTnSortToTableSort<CronjobRow>(event, this.displayedColumns));
  }

  protected onConfigClosed(saved: boolean): void {
    this.configOpen.set(false);
    this.editingCronjob.set(undefined);
    if (saved) {
      this.getCronJobs();
    }
  }
}
