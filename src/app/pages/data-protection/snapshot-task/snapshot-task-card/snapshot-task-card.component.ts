import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, switchMap } from 'rxjs';
import { PeriodicSnapshotTaskUi } from 'app/interfaces/periodic-snapshot-task.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { toggleColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-toggle/ix-cell-toggle.component';
import { createTable } from 'app/modules/ix-table2/utils';
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
  snapshotTasks: PeriodicSnapshotTaskUi[] = [];
  dataProvider = new ArrayDataProvider<PeriodicSnapshotTaskUi>();
  isLoading = false;

  columns = createTable<PeriodicSnapshotTaskUi>([
    textColumn({
      title: this.translate.instant('Pool/Dataset'),
      propertyName: 'dataset',
    }),
    textColumn({
      title: this.translate.instant('Keep for'),
      propertyName: 'keepfor',
    }),
    textColumn({
      title: this.translate.instant('Frequency'),
      propertyName: 'frequency',
    }),
    textColumn({
      title: this.translate.instant('Next Run'),
      propertyName: 'next_run',
    }),
    toggleColumn({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
      cssClass: 'justify-end',
      onRowToggle: (row: PeriodicSnapshotTaskUi) => this.onChangeEnabledState(row),
    }),
    textColumn({
      title: this.translate.instant('State'),
      propertyName: 'state',
    }),
    textColumn({
      propertyName: 'id',
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
  ) {}

  ngOnInit(): void {
    this.getSnapshotTasks();
  }

  getSnapshotTasks(): void {
    this.isLoading = true;
    this.ws.call('pool.snapshottask.query').pipe(
      untilDestroyed(this),
    ).subscribe((snapshotTasks: PeriodicSnapshotTaskUi[]) => {
      const transformedSnapshotTasks = this.transformSnapshotTasks(snapshotTasks);
      this.snapshotTasks = transformedSnapshotTasks;
      this.dataProvider.setRows(transformedSnapshotTasks);
      this.isLoading = false;
      this.cdr.markForCheck();
    });
  }

  doDelete(scrubTask: PeriodicSnapshotTaskUi): void {
    this.dialogService.confirm({
      title: this.translate.instant('Confirmation'),
      message: this.translate.instant('Delete Periodic Snapshot Task <b>"{value}"</b>?', {
        value: `${scrubTask.dataset} - ${scrubTask.naming_schema} - ${scrubTask.keepfor}`,
      }),
    }).pipe(
      filter(Boolean),
      switchMap(() => this.ws.call('pool.snapshottask.delete', [scrubTask.id])),
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

    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => {
      this.getSnapshotTasks();
    });
  }

  private onChangeEnabledState(scrubTask: PeriodicSnapshotTaskUi): void {
    this.ws
      .call('pool.snapshottask.update', [scrubTask.id, { enabled: !scrubTask.enabled } as PeriodicSnapshotTaskUi])
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

  private transformSnapshotTasks(snapshotTasks: PeriodicSnapshotTaskUi[]): PeriodicSnapshotTaskUi[] {
    return snapshotTasks.map((task) => {
      task.keepfor = `${task.lifetime_value} ${task.lifetime_unit}(S)`;
      task.cron_schedule = scheduleToCrontab(task.schedule);
      task.frequency = this.taskService.getTaskCronDescription(task.cron_schedule);
      task.next_run = this.taskService.getTaskNextRun(task.cron_schedule);

      return task;
    });
  }
}
