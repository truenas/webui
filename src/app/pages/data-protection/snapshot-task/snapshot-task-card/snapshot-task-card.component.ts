import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, map, switchMap } from 'rxjs';
import { PeriodicSnapshotTaskUi } from 'app/interfaces/periodic-snapshot-task.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { AsyncDataProvider } from 'app/modules/ix-table2/async-data-provider';
import { actionsColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { relativeDateColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-relative-date/ix-cell-relative-date.component';
import { stateButtonColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-state-button/ix-cell-state-button.component';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { toggleColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-toggle/ix-cell-toggle.component';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { SnapshotTaskFormComponent } from 'app/pages/data-protection/snapshot-task/snapshot-task-form/snapshot-task-form.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { TaskService } from 'app/services/task.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-snapshot-task-card',
  templateUrl: './snapshot-task-card.component.html',
  styleUrls: ['./snapshot-task-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SnapshotTaskCardComponent implements OnInit {
  dataProvider: AsyncDataProvider<PeriodicSnapshotTaskUi>;

  columns = createTable<PeriodicSnapshotTaskUi>([
    textColumn({
      title: this.translate.instant('Pool/Dataset'),
      propertyName: 'dataset',
    }),
    textColumn({
      title: this.translate.instant('Keep for'),
      getValue: (row) => `${row.lifetime_value} ${row.lifetime_unit}(S)`.toLowerCase(),
    }),
    textColumn({
      title: this.translate.instant('Frequency'),
      propertyName: 'frequency',
      getValue: (row) => this.taskService.getTaskCronDescription(scheduleToCrontab(row.schedule)),
    }),
    relativeDateColumn({
      title: this.translate.instant('Next Run'),
      getValue: (row) => this.taskService.getTaskNextTime(scheduleToCrontab(row.schedule)) as unknown,
    }),
    relativeDateColumn({
      title: this.translate.instant('Last Run'),
      getValue: (row) => row.state?.datetime?.$date,
    }),
    toggleColumn({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
      onRowToggle: (row: PeriodicSnapshotTaskUi) => this.onChangeEnabledState(row),
    }),
    stateButtonColumn({
      title: this.translate.instant('State'),
      getValue: (row) => row.state.state,
      cssClass: 'state-button',
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
    private cdr: ChangeDetectorRef,
    private taskService: TaskService,
    protected emptyService: EmptyService,
  ) {}

  ngOnInit(): void {
    const snapshotTasks$ = this.ws.call('pool.snapshottask.query').pipe(
      map((snapshotTasks) => snapshotTasks as PeriodicSnapshotTaskUi[]),
      untilDestroyed(this),
    );
    this.dataProvider = new AsyncDataProvider<PeriodicSnapshotTaskUi>(snapshotTasks$);
  }

  getSnapshotTasks(): void {
    this.dataProvider.refresh();
  }

  doDelete(snapshotTask: PeriodicSnapshotTaskUi): void {
    this.dialogService.confirm({
      title: this.translate.instant('Confirmation'),
      message: this.translate.instant('Delete Periodic Snapshot Task <b>"{value}"</b>?', {
        value: `${snapshotTask.dataset} - ${snapshotTask.naming_schema} - ${snapshotTask.keepfor}`,
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

  openForm(row?: PeriodicSnapshotTaskUi): void {
    const slideInRef = this.slideInService.open(SnapshotTaskFormComponent, { data: row, wide: true });

    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.getSnapshotTasks();
    });
  }

  private onChangeEnabledState(snapshotTask: PeriodicSnapshotTaskUi): void {
    this.ws
      .call('pool.snapshottask.update', [snapshotTask.id, { enabled: !snapshotTask.enabled } as PeriodicSnapshotTaskUi])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.getSnapshotTasks();
        },
        error: (err: WebsocketError) => {
          this.getSnapshotTasks();
          this.dialogService.error(this.errorHandler.parseWsError(err));
        },
      });
  }
}
