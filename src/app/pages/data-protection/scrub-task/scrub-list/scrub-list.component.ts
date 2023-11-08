import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, switchMap } from 'rxjs/operators';
import { PoolScrubTask } from 'app/interfaces/pool-scrub.interface';
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
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import {
  yesNoColumn,
} from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-yesno/ix-cell-yesno.component';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { CrontabExplanationPipe } from 'app/modules/scheduler/pipes/crontab-explanation.pipe';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { ScrubTaskFormComponent } from 'app/pages/data-protection/scrub-task/scrub-task-form/scrub-task-form.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { TaskService } from 'app/services/task.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-scrub-list',
  templateUrl: './scrub-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CrontabExplanationPipe],
})
export class ScrubListComponent implements OnInit {
  dataProvider: AsyncDataProvider<PoolScrubTask>;

  columns = createTable<PoolScrubTask>([
    textColumn({
      title: this.translate.instant('Pool'),
      propertyName: 'pool_name',
    }),
    textColumn({
      title: this.translate.instant('Threshold Days'),
      propertyName: 'threshold',
    }),
    textColumn({
      title: this.translate.instant('Description'),
      propertyName: 'description',
    }),
    scheduleColumn({
      title: this.translate.instant('Schedule'),
      propertyName: 'schedule',
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
    yesNoColumn({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
    }),
    actionsColumn({
      actions: [
        {
          iconName: 'edit',
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.onEdit(row),
        },
        {
          iconName: 'delete',
          tooltip: this.translate.instant('Delete'),
          onClick: (row) => this.onDelete(row),
        },
      ],
    }),
  ]);

  constructor(
    private translate: TranslateService,
    private crontabExplanation: CrontabExplanationPipe,
    private taskService: TaskService,
    private ws: WebSocketService,
    private slideIn: IxSlideInService,
    private dialogService: DialogService,
    private loader: AppLoaderService,
    private errorHandler: ErrorHandlerService,
    protected emptyService: EmptyService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.dataProvider = new AsyncDataProvider(this.ws.call('pool.scrub.query'));
    this.dataProvider.load();
  }

  protected columnsChange(columns: typeof this.columns): void {
    this.columns = [...columns];
    this.cdr.detectChanges();
    this.cdr.markForCheck();
  }

  protected onAdd(): void {
    this.slideIn.open(ScrubTaskFormComponent)
      .slideInClosed$
      .pipe(untilDestroyed(this))
      .subscribe(() => this.dataProvider.load());
  }

  private onEdit(row: PoolScrubTask): void {
    this.slideIn.open(ScrubTaskFormComponent, { data: row })
      .slideInClosed$
      .pipe(untilDestroyed(this))
      .subscribe(() => this.dataProvider.load());
  }

  private onDelete(row: PoolScrubTask): void {
    this.dialogService.confirm({
      title: this.translate.instant('Delete Task'),
      message: this.translate.instant('Are you sure you want to delete this task?'),
      buttonText: this.translate.instant('Delete'),
    })
      .pipe(
        filter(Boolean),
        switchMap(() => {
          return this.ws.call('pool.scrub.delete', [row.id]).pipe(
            this.loader.withLoader(),
            this.errorHandler.catchError(),
          );
        }),
        untilDestroyed(this),
      )
      .subscribe(() => this.dataProvider.load());
  }
}
