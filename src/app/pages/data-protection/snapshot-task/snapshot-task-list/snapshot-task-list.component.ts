import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { YesNoPipe } from 'app/core/pipes/yes-no.pipe';
import { JobState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { formatDistanceToNowShortened } from 'app/helpers/format-distance-to-now-shortened';
import {
  PeriodicSnapshotTask,
  PeriodicSnapshotTaskUi,
  PeriodicSnapshotTaskUpdate,
} from 'app/interfaces/periodic-snapshot-task.interface';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/modules/entity/entity-table/entity-table.interface';
import { extractActiveHoursFromCron, scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { SnapshotTaskFormComponent } from 'app/pages/data-protection/snapshot-task/snapshot-task-form/snapshot-task-form.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { StorageService } from 'app/services/storage.service';
import { TaskService } from 'app/services/task.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  template: '<ix-entity-table [title]="title" [conf]="this"></ix-entity-table>',
  providers: [TaskService, StorageService],
})
export class SnapshotTaskListComponent implements EntityTableConfig<PeriodicSnapshotTaskUi> {
  title = this.translate.instant('Periodic Snapshot Tasks');
  queryCall = 'pool.snapshottask.query' as const;
  updateCall = 'pool.snapshottask.update' as const;
  wsDelete = 'pool.snapshottask.delete' as const;
  routeAdd: string[] = ['tasks', 'snapshot', 'add'];
  routeAddTooltip = this.translate.instant('Add Periodic Snapshot Task');
  routeEdit: string[] = ['tasks', 'snapshot', 'edit'];
  entityList: EntityTableComponent<PeriodicSnapshotTaskUi>;
  filterValue = '';

  columns = [
    { name: this.translate.instant('Pool/Dataset'), prop: 'dataset', always_display: true },
    { name: this.translate.instant('Recursive'), prop: 'recursive' },
    { name: this.translate.instant('Naming Schema'), prop: 'naming_schema' },
    { name: this.translate.instant('When'), prop: 'when' },
    { name: this.translate.instant('Frequency'), prop: 'frequency', enableMatTooltip: true },
    { name: this.translate.instant('Next Run'), prop: 'next_run', hidden: true },
    { name: this.translate.instant('Last Run'), prop: 'last_run', hidden: true },
    { name: this.translate.instant('Keep snapshot for'), prop: 'keepfor', hidden: true },
    { name: this.translate.instant('Legacy'), prop: 'legacy', hidden: true },
    { name: this.translate.instant('VMware Sync'), prop: 'vmware_sync', hidden: true },
    { name: this.translate.instant('Enabled'), prop: 'enabled', selectable: true },
    {
      name: this.translate.instant('State'), prop: 'state', state: 'state', button: true,
    },
  ];
  rowIdentifier = 'id';
  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: this.translate.instant('Periodic Snapshot Task'),
      key_props: ['dataset', 'naming_schema', 'keepfor'],
    },
  };

  customActions = [{
    id: 'snapshots',
    name: this.translate.instant('Snapshots'),
    function: () => {
      this.router.navigate(['/datasets/snapshots']);
    },
  }];

  constructor(
    private dialogService: DialogService,
    private ws: WebSocketService,
    private taskService: TaskService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private slideInService: IxSlideInService,
    private route: ActivatedRoute,
    private router: Router,
    private yesNoPipe: YesNoPipe,
  ) {
    this.filterValue = this.route.snapshot.paramMap.get('dataset') || '';
  }

  afterInit(entityList: EntityTableComponent<PeriodicSnapshotTaskUi>): void {
    this.entityList = entityList;
  }

  resourceTransformIncomingRestData(tasks: PeriodicSnapshotTask[]): PeriodicSnapshotTaskUi[] {
    return tasks.map((task) => {
      const cronSchedule = scheduleToCrontab(task.schedule);
      const activeHours = extractActiveHoursFromCron(cronSchedule);

      const transformedTask = {
        ...task,
        keepfor: `${task.lifetime_value} ${task.lifetime_unit}(S)`,
        when: this.translate.instant('From {task_begin} to {task_end}', {
          task_begin: activeHours.start,
          task_end: activeHours.end,
        }),
        cron_schedule: cronSchedule,
      } as PeriodicSnapshotTaskUi;

      return {
        ...transformedTask,
        last_run:
          transformedTask.state?.datetime?.$date
            ? formatDistanceToNowShortened(transformedTask.state?.datetime?.$date)
            : this.translate.instant('N/A'),
        frequency: this.taskService.getTaskCronDescription(transformedTask.cron_schedule),
        next_run: this.taskService.getTaskNextRun(transformedTask.cron_schedule),
      };
    });
  }

  getActions(): EntityTableAction<PeriodicSnapshotTaskUi>[] {
    return [{
      id: 'edit',
      icon: 'edit',
      label: 'Edit',
      onClick: (row: PeriodicSnapshotTaskUi) => {
        this.doEdit(row.id);
      },
    }, {
      id: 'delete',
      icon: 'delete',
      label: 'Delete',
      requiredRoles: [Role.FullAdmin],
      onClick: (rowinner: PeriodicSnapshotTaskUi) => {
        this.entityList.doDelete(rowinner);
      },
    }] as EntityTableAction[];
  }

  onButtonClick(row: PeriodicSnapshotTaskUi): void {
    this.stateButton(row);
  }

  stateButton(row: PeriodicSnapshotTaskUi): void {
    if (row.state.state === JobState.Error) {
      this.dialogService.error({ title: row.state.state, message: row.state.error });
    }
  }

  onCheckboxChange(row: PeriodicSnapshotTaskUi): void {
    row.enabled = !row.enabled;
    this.ws.call(this.updateCall, [row.id, { enabled: row.enabled } as PeriodicSnapshotTaskUpdate])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (task) => {
          if (!task) {
            row.enabled = !row.enabled;
          }
        },
        error: (error: unknown) => {
          row.enabled = !row.enabled;
          this.dialogService.error(this.errorHandler.parseError(error));
        },
      });
  }

  doAdd(): void {
    const slideInRef = this.slideInService.open(SnapshotTaskFormComponent, { wide: true });
    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => this.entityList.getData());
  }

  doEdit(id: number): void {
    const snapshotTask = this.entityList.rows.find((row) => row.id === id);
    const slideInRef = this.slideInService.open(SnapshotTaskFormComponent, { wide: true, data: snapshotTask });
    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => this.entityList.getData());
  }
}
