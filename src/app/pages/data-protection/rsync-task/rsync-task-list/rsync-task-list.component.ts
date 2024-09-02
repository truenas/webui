import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  filter, switchMap, tap,
} from 'rxjs/operators';
import { JobState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { RsyncTask } from 'app/interfaces/rsync-task.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import {
  actionsColumn,
} from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
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
import { createTable } from 'app/modules/ix-table/utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { CrontabExplanationPipe } from 'app/modules/scheduler/pipes/crontab-explanation.pipe';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { RsyncTaskFormComponent } from 'app/pages/data-protection/rsync-task/rsync-task-form/rsync-task-form.component';
import { rsyncTaskListElements } from 'app/pages/data-protection/rsync-task/rsync-task-list/rsync-task-list.elements';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';
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
  readonly requiredRoles = [Role.FullAdmin];
  protected readonly searchableElements = rsyncTaskListElements;

  dataProvider: AsyncDataProvider<RsyncTask>;
  filterString = '';

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
      getValue: (task) => this.crontabExplanation.transform(scheduleToCrontab(task.schedule)),
    }),
    relativeDateColumn({
      title: this.translate.instant('Next Run'),
      getValue: (row) => (row.enabled
        ? this.taskService.getTaskNextTime(scheduleToCrontab(row.schedule))
        : this.translate.instant('Disabled')),
    }),
    relativeDateColumn({
      title: this.translate.instant('Last Run'),
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
          requiredRoles: this.requiredRoles,
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
          requiredRoles: this.requiredRoles,
          onClick: (row) => this.delete(row),
        },
      ],
    }),
  ], {
    rowTestId: (row) => 'rsync-task-' + row.path + '-' + row.remotehost,
    ariaLabels: (row) => [row.path, row.remotehost, this.translate.instant('Rsync Task')],
  });

  constructor(
    private translate: TranslateService,
    private ws: WebSocketService,
    private chainedSlideInService: IxChainedSlideInService,
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

    const request$ = this.ws.call('rsynctask.query');
    this.dataProvider = new AsyncDataProvider(request$);
    this.refresh();
    this.dataProvider.emptyType$.pipe(untilDestroyed(this)).subscribe(() => {
      this.onListFiltered(this.filterString);
    });
  }

  protected onListFiltered(query: string): void {
    this.filterString = query;
    this.dataProvider.setFilter({ query, columnKeys: ['path', 'desc'] });
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
      .subscribe(() => this.refresh());
  }

  protected add(): void {
    const closer$ = this.chainedSlideInService.open(RsyncTaskFormComponent, true);
    closer$.pipe(filter((response) => !!response.response), untilDestroyed(this))
      .subscribe(() => this.refresh());
  }

  private edit(row: RsyncTask): void {
    const closer$ = this.chainedSlideInService.open(RsyncTaskFormComponent, true, row);
    closer$.pipe(filter((response) => !!response.response), untilDestroyed(this))
      .subscribe(() => this.refresh());
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
      .subscribe(() => this.refresh());
  }

  private filterTask = (task: RsyncTask): boolean => {
    return task.remotehost?.includes(this.filterString)
      || task.path.toLowerCase().includes(this.filterString)
      || task.desc.toLowerCase().includes(this.filterString);
  };

  private refresh(): void {
    this.dataProvider.load();
  }
}
