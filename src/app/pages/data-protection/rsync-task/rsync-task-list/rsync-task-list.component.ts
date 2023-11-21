import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, map, switchMap, tap } from 'rxjs/operators';
import { JobState } from 'app/enums/job-state.enum';
import { RsyncTask } from 'app/interfaces/rsync-task.interface';
import { AsyncDataProvider } from 'app/modules/ix-table2/async-data-provider';
import {
  actionsColumn,
} from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import {
  relativeDateColumn,
} from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-relative-date/ix-cell-relative-date.component';
import {
  scheduleColumn,
} from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-schedule/ix-cell-schedule.component';
import {
  stateButtonColumn,
} from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-state-button/ix-cell-state-button.component';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import {
  yesNoColumn,
} from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-yesno/ix-cell-yesno.component';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { CrontabExplanationPipe } from 'app/modules/scheduler/pipes/crontab-explanation.pipe';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { RsyncTaskFormComponent } from 'app/pages/data-protection/rsync-task/rsync-task-form/rsync-task-form.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { TaskService } from 'app/services/task.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-rsync-task-list',
  templateUrl: './rsync-task-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CrontabExplanationPipe],
})
export class RsyncTaskListComponent implements OnInit {
  dataProvider: AsyncDataProvider<RsyncTask>;
  filterString: string;

  columns = createTable<RsyncTask>([
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
    textColumn({
      title: this.translate.instant('Frequency'),
      propertyName: 'schedule',
      sortable: false,
      getValue: (task) => this.crontabExplanation.transform(scheduleToCrontab(task.schedule)),
    }),
    relativeDateColumn({
      title: this.translate.instant('Next Run'),
      getValue: (row) => this.taskService.getTaskNextTime(scheduleToCrontab(row.schedule)),
    }),
    relativeDateColumn({
      title: this.translate.instant('Last Run'),
      propertyName: 'job',
      getValue: (row) => row.job?.time_finished?.$date,
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
      getValue: (row) => {
        if (!row.job) {
          return row.locked ? JobState.Locked : JobState.Pending;
        }

        return row.job.state;
      },
      getJob: (row) => row.job,
      cssClass: 'state-button',
    }),
    yesNoColumn({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
    }),
    actionsColumn({
      actions: [
        {
          iconName: 'play_arrow',
          tooltip: this.translate.instant('Run job'),
          onClick: (row) => this.runNow(row),
        },
        {
          iconName: 'edit',
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.edit(row),
        },
        {
          iconName: 'delete',
          tooltip: this.translate.instant('Delete'),
          onClick: (row) => this.delete(row),
        },
      ],
    }),
  ]);

  private allTasks: RsyncTask[] = [];

  constructor(
    private translate: TranslateService,
    private ws: WebSocketService,
    private slideIn: IxSlideInService,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
    private loader: AppLoaderService,
    private crontabExplanation: CrontabExplanationPipe,
    private taskService: TaskService,
    private snackbar: SnackbarService,
    protected emptyService: EmptyService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.filterString = this.route.snapshot.paramMap.get('dataset') || '';

    const request$ = this.ws.call('rsynctask.query').pipe(
      map((tasks) => {
        this.allTasks = tasks;
        return tasks.filter(this.filterTask);
      }),
    );
    this.dataProvider = new AsyncDataProvider(request$);
    this.dataProvider.load();
  }

  protected filterUpdated(query: string): void {
    this.filterString = query;
    this.dataProvider.setRows(this.allTasks.filter(this.filterTask));
  }

  protected columnsChange(columns: typeof this.columns): void {
    this.columns = [...columns];
    this.cdr.detectChanges();
    this.cdr.markForCheck();
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
        switchMap(() => this.ws.job('rsynctask.run', [row.id])),
        untilDestroyed(this),
      )
      .subscribe(() => this.dataProvider.load());
  }

  protected add(): void {
    this.slideIn.open(RsyncTaskFormComponent, { wide: true })
      .slideInClosed$
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.dataProvider.load());
  }

  private edit(row: RsyncTask): void {
    this.slideIn.open(RsyncTaskFormComponent, { data: row, wide: true })
      .slideInClosed$
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.dataProvider.load());
  }

  private delete(row: RsyncTask): void {
    this.dialogService.confirm({
      title: this.translate.instant('Delete Task'),
      message: this.translate.instant('Are you sure you want to delete this task?'),
      buttonText: this.translate.instant('Delete'),
    })
      .pipe(
        filter(Boolean),
        switchMap(() => {
          return this.ws.call('rsynctask.delete', [row.id]).pipe(
            this.loader.withLoader(),
            this.errorHandler.catchError(),
          );
        }),
        untilDestroyed(this),
      )
      .subscribe(() => this.dataProvider.load());
  }

  private filterTask = (task: RsyncTask): boolean => {
    return task.remotehost?.includes(this.filterString)
      || task.path.includes(this.filterString)
      || task.desc.includes(this.filterString);
  };
}
