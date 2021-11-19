import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { JobState } from 'app/enums/job-state.enum';
import { PeriodicSnapshotTask, PeriodicSnapshotTaskUi } from 'app/interfaces/periodic-snapshot-task.interface';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table/entity-table.component';
import { EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { SnapshotFormComponent } from 'app/pages/data-protection/snapshot/snapshot-form/snapshot-form.component';
import { DialogService, StorageService, WebSocketService } from 'app/services';
import { ModalService } from 'app/services/modal.service';
import { TaskService } from 'app/services/task.service';

@UntilDestroy()
@Component({
  selector: 'app-snapshot-task-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
  providers: [TaskService, StorageService],
})
export class SnapshotListComponent implements EntityTableConfig<PeriodicSnapshotTaskUi> {
  title = this.translate.instant('Periodic Snapshot Tasks');
  queryCall = 'pool.snapshottask.query' as const;
  updateCall = 'pool.snapshottask.update' as const;
  wsDelete = 'pool.snapshottask.delete' as const;
  route_add: string[] = ['tasks', 'snapshot', 'add'];
  route_add_tooltip = 'Add Periodic Snapshot Task';
  route_edit: string[] = ['tasks', 'snapshot', 'edit'];
  entityList: EntityTableComponent;
  asyncView = true;

  columns = [
    { name: this.translate.instant('Pool/Dataset'), prop: 'dataset', always_display: true },
    { name: this.translate.instant('Recursive'), prop: 'recursive' },
    { name: this.translate.instant('Naming Schema'), prop: 'naming_schema' },
    { name: this.translate.instant('When'), prop: 'when' },
    { name: this.translate.instant('Frequency'), prop: 'frequency', enableMatTooltip: true },
    { name: this.translate.instant('Next Run'), prop: 'next_run', hidden: true },
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

  constructor(
    private dialogService: DialogService,
    private ws: WebSocketService,
    private taskService: TaskService,
    private modalService: ModalService,
    private translate: TranslateService,
  ) {}

  afterInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;
    this.modalService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      this.entityList.getData();
    });
  }

  resourceTransformIncomingRestData(data: PeriodicSnapshotTask[]): PeriodicSnapshotTaskUi[] {
    return data.map((task) => {
      const transformedTask = {
        ...task,
        keepfor: `${task.lifetime_value} ${task.lifetime_unit}(S)`,
        when: this.translate.instant('From {task_begin} to {task_end}', { task_begin: task.schedule.begin, task_end: task.schedule.end }),
        cron_schedule: `${task.schedule.minute} ${task.schedule.hour} ${task.schedule.dom} ${task.schedule.month} ${task.schedule.dow}`,
      } as PeriodicSnapshotTaskUi;

      return {
        ...transformedTask,
        next_run: this.taskService.getTaskNextRun(transformedTask.cron_schedule),
        frequency: this.taskService.getTaskCronDescription(transformedTask.cron_schedule),
      };
    });
  }

  onButtonClick(row: PeriodicSnapshotTaskUi): void {
    this.stateButton(row);
  }

  stateButton(row: PeriodicSnapshotTaskUi): void {
    if (row.state.state === JobState.Error) {
      this.dialogService.errorReport(row.state.state, row.state.error);
    }
  }

  onCheckboxChange(row: PeriodicSnapshotTaskUi): void {
    row.enabled = !row.enabled;
    this.ws.call(this.updateCall, [row.id, { enabled: row.enabled }]).pipe(untilDestroyed(this)).subscribe(
      (res) => {
        if (!res) {
          row.enabled = !row.enabled;
        }
      },
      (err) => {
        row.enabled = !row.enabled;
        new EntityUtils().handleWsError(this, err, this.dialogService);
      },
    );
  }

  doAdd(id?: number): void {
    this.modalService.openInSlideIn(SnapshotFormComponent, id);
  }

  doEdit(id: number): void {
    this.doAdd(id);
  }
}
