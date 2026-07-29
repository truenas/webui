import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  tnIconMarker,
  TnButtonComponent,
  TnCardComponent,
  TnCardFooterActionsDirective,
  TnCellDefDirective,
  TnDialog,
  TnEmptyComponent,
  TnHeaderCellDefDirective,
  TnTableColumnDirective,
  TnTableComponent,
} from '@truenas/ui-components';
import { isValid } from 'date-fns';
import {
  filter, map, switchMap, take, tap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { formatDistanceToNowShortened } from 'app/helpers/format-distance-to-now-shortened';
import { helptextSystemAdvanced } from 'app/helptext/system/advanced';
import { ScheduleDescriptionPipe } from 'app/modules/dates/pipes/schedule-description/schedule-description.pipe';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import {
  TableActionsCellComponent,
} from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { cronCardElements } from 'app/pages/system/advanced/cron/cron-card/cron-card.elements';
import { CronDeleteDialog } from 'app/pages/system/advanced/cron/cron-delete-dialog/cron-delete-dialog.component';
import { CronFormComponent } from 'app/pages/system/advanced/cron/cron-form/cron-form.component';
import { CronjobRow } from 'app/pages/system/advanced/cron/cron-list/cronjob-row.interface';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';
import { TaskService } from 'app/services/task.service';

@Component({
  selector: 'ix-cron-card',
  templateUrl: './cron-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardFooterActionsDirective,
    RequiresRolesDirective,
    TnButtonComponent,
    UiSearchDirective,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnEmptyComponent,
    TableActionsCellComponent,
    TranslateModule,
    AsyncPipe,
    YesNoPipe,
    ScheduleDescriptionPipe,
  ],
})
export class CronCardComponent implements OnInit {
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);
  private api = inject(ApiService);
  private dialog = inject(DialogService);
  private taskService = inject(TaskService);
  private tnDialog = inject(TnDialog);
  private firstTimeWarning = inject(FirstTimeWarningService);
  protected emptyService = inject(EmptyService);
  private formPanel = inject(FormSidePanelService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.SystemCronWrite];
  protected readonly searchableElements = cronCardElements;

  title = helptextSystemAdvanced.cronTitle;
  cronjobs: CronjobRow[] = [];
  dataProvider: AsyncDataProvider<CronjobRow>;

  protected readonly displayedColumns = ['user', 'command', 'description', 'schedule', 'enabled', 'next_run', 'actions'];

  protected readonly trackBy = (_: number, row: CronjobRow): number => row.id;

  protected readonly actions: IconActionConfig<CronjobRow>[] = [
    {
      iconName: tnIconMarker('play-circle', 'mdi'),
      tooltip: this.translate.instant('Run job'),
      onClick: (row) => this.runNow(row),
      requiredRoles: this.requiredRoles,
    },
    {
      iconName: tnIconMarker('pencil', 'mdi'),
      tooltip: this.translate.instant('Edit'),
      onClick: (row) => this.doEdit(row),
    },
    {
      iconName: tnIconMarker('delete', 'mdi'),
      tooltip: this.translate.instant('Delete'),
      onClick: (row) => this.doDelete(row),
      requiredRoles: this.requiredRoles,
    },
  ];

  protected uniqueRowTag(row: CronjobRow): string {
    return 'card-cron-' + row.command + '-' + row.user;
  }

  protected ariaLabel(row: CronjobRow): string {
    return [row.command, this.translate.instant('Cron Job')].join(' ');
  }

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
  }

  onAdd(): void {
    this.firstTimeWarning.showFirstTimeWarningIfNeeded().pipe(
      take(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.formPanel.open(CronFormComponent, { title: this.translate.instant('Add Cron Job') })
        .onSuccess(() => this.getCronJobs(), this.destroyRef);
    });
  }

  getCronJobs(): void {
    this.dataProvider.load();
  }

  runNow(row: CronjobRow): void {
    this.dialog.confirm({
      title: this.translate.instant('Run Now'),
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

  doDelete(row: CronjobRow): void {
    this.tnDialog.open(CronDeleteDialog, {
      data: row,
    }).closed
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.getCronJobs();
      });
  }

  doEdit(row: CronjobRow): void {
    this.firstTimeWarning.showFirstTimeWarningIfNeeded().pipe(
      take(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.formPanel.open(CronFormComponent, {
        title: this.translate.instant('Edit Cron Job'),
        inputs: { editCronjob: row },
      }).onSuccess(() => this.getCronJobs(), this.destroyRef);
    });
  }
}
