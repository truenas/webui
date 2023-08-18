import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { ScrubTaskUi } from 'app/interfaces/scrub-task.interface';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/modules/entity/entity-table/entity-table.interface';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import {
  ScrubTaskFormComponent,
} from 'app/pages/data-protection/scrub-task/scrub-task-form/scrub-task-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { TaskService } from 'app/services/task.service';
import { UserService } from 'app/services/user.service';

@UntilDestroy()
@Component({
  template: '<ix-entity-table [title]="title" [conf]="this"></ix-entity-table>',
  providers: [TaskService, UserService],
})
export class ScrubListComponent implements EntityTableConfig {
  title = this.translate.instant('Scrub Tasks');
  queryCall = 'pool.scrub.query' as const;
  wsDelete = 'pool.scrub.delete' as const;
  routeAdd: string[] = ['tasks', 'scrub', 'add'];
  routeAddTooltip = this.translate.instant('Add Scrub Task');
  routeEdit: string[] = ['tasks', 'scrub', 'edit'];
  entityList: EntityTableComponent;
  parent: ScrubListComponent;

  columns = [
    { name: this.translate.instant('Pool'), prop: 'pool_name', always_display: true },
    { name: this.translate.instant('Threshold days'), prop: 'threshold' },
    { name: this.translate.instant('Description'), prop: 'description' },
    {
      name: this.translate.instant('Schedule'),
      prop: 'cron_schedule',
      widget: {
        icon: 'calendar-range',
        component: 'TaskScheduleListComponent',
      },
    },
    { name: this.translate.instant('Frequency'), prop: 'frequency', enableMatTooltip: true },
    { name: this.translate.instant('Next Run'), prop: 'next_run' },
    { name: this.translate.instant('Enabled'), prop: 'enabled' },
  ];
  rowIdentifier = 'id';
  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: this.translate.instant('Scrub Task'),
      key_props: ['pool_name'],
    },
  };

  constructor(
    protected taskService: TaskService,
    protected slideInService: IxSlideInService,
    protected translate: TranslateService,
  ) {}

  afterInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;
  }

  resourceTransformIncomingRestData(data: ScrubTaskUi[]): ScrubTaskUi[] {
    return data.map((task) => {
      task.cron_schedule = scheduleToCrontab(task.schedule);
      task.frequency = this.taskService.getTaskCronDescription(task.cron_schedule);
      task.next_run = this.taskService.getTaskNextRun(task.cron_schedule);

      return task;
    });
  }

  doAdd(): void {
    const slideInRef = this.slideInService.open(ScrubTaskFormComponent);
    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => this.entityList.getData());
  }

  getActions(): EntityTableAction<ScrubTaskUi>[] {
    return [{
      id: 'edit',
      icon: 'edit',
      label: 'Edit',
      onClick: (row: ScrubTaskUi) => {
        const slideInRef = this.slideInService.open(ScrubTaskFormComponent, { data: row });
        slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => this.entityList.getData());
      },
    }, {
      id: 'delete',
      icon: 'delete',
      label: 'Delete',
      onClick: (rowinner: ScrubTaskUi) => {
        this.entityList.doDelete(rowinner);
      },
    }] as EntityTableAction[];
  }
}
