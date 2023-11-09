import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, switchMap } from 'rxjs';
import { PoolScrubTask } from 'app/interfaces/pool-scrub.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { AsyncDataProvider } from 'app/modules/ix-table2/async-data-provider';
import { actionsColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { relativeDateColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-relative-date/ix-cell-relative-date.component';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { toggleColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-toggle/ix-cell-toggle.component';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { ScrubTaskFormComponent } from 'app/pages/data-protection/scrub-task/scrub-task-form/scrub-task-form.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { TaskService } from 'app/services/task.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-scrub-task-card',
  templateUrl: './scrub-task-card.component.html',
  styleUrls: ['./scrub-task-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScrubTaskCardComponent implements OnInit {
  dataProvider: AsyncDataProvider<PoolScrubTask>;

  columns = createTable<PoolScrubTask>([
    textColumn({
      title: this.translate.instant('Pool'),
      propertyName: 'pool_name',
    }),
    textColumn({
      title: this.translate.instant('Description'),
      propertyName: 'description',
    }),
    textColumn({
      title: this.translate.instant('Frequency'),
      getValue: (task) => this.taskService.getTaskCronDescription(scheduleToCrontab(task.schedule)),
    }),
    relativeDateColumn({
      title: this.translate.instant('Next Run'),
      getValue: (task) => this.taskService.getTaskNextTime(scheduleToCrontab(task.schedule)) as unknown,
    }),
    toggleColumn({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
      onRowToggle: (row: PoolScrubTask) => this.onChangeEnabledState(row),
    }),
    actionsColumn({
      actions: [
        {
          iconName: 'edit',
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.openForm(row),
        },
        {
          iconName: 'delete',
          tooltip: this.translate.instant('Delete'),
          onClick: (row) => this.doDelete(row),
        },
      ],
    }),
  ]);

  constructor(
    private slideInService: IxSlideInService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private ws: WebSocketService,
    private dialogService: DialogService,
    private taskService: TaskService,
    protected emptyService: EmptyService,
  ) {}

  ngOnInit(): void {
    const scrubTasks$ = this.ws.call('pool.scrub.query');
    this.dataProvider = new AsyncDataProvider<PoolScrubTask>(scrubTasks$);
    this.getScrubTasks();
  }

  getScrubTasks(): void {
    this.dataProvider.load();
  }

  doDelete(scrubTask: PoolScrubTask): void {
    this.dialogService.confirm({
      title: this.translate.instant('Confirmation'),
      message: this.translate.instant('Delete Scrub Task <b>"{name}"</b>?', { name: scrubTask.pool_name }),
    }).pipe(
      filter(Boolean),
      switchMap(() => this.ws.call('pool.scrub.delete', [scrubTask.id])),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.getScrubTasks();
      },
      error: (err) => {
        this.dialogService.error(this.errorHandler.parseError(err));
      },
    });
  }

  openForm(row?: PoolScrubTask): void {
    const slideInRef = this.slideInService.open(ScrubTaskFormComponent, { data: row });

    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.getScrubTasks();
    });
  }

  private onChangeEnabledState(scrubTask: PoolScrubTask): void {
    this.ws
      .call('pool.scrub.update', [scrubTask.id, { enabled: !scrubTask.enabled } as PoolScrubTask])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.getScrubTasks();
        },
        error: (err: WebsocketError) => {
          this.getScrubTasks();
          this.dialogService.error(this.errorHandler.parseWsError(err));
        },
      });
  }
}
