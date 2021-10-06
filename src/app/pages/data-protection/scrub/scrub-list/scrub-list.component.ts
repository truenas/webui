import { Component } from '@angular/core';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { ScrubTaskUi } from 'app/interfaces/scrub-task.interface';
import { EntityFormService } from 'app/pages/common/entity/entity-form/services/entity-form.service';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table/entity-table.component';
import { EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { ScrubFormComponent } from 'app/pages/data-protection/scrub/scrub-form/scrub-form.component';
import { UserService, TaskService } from 'app/services';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  selector: 'app-scrub-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
  providers: [TaskService, UserService, EntityFormService],
})
export class ScrubListComponent implements EntityTableConfig {
  title = T('Scrub Tasks');
  queryCall: 'pool.scrub.query' = 'pool.scrub.query';
  wsDelete: 'pool.scrub.delete' = 'pool.scrub.delete';
  route_add: string[] = ['tasks', 'scrub', 'add'];
  route_add_tooltip = this.translate.instant(T('Add Scrub Task'));
  route_edit: string[] = ['tasks', 'scrub', 'edit'];
  entityList: EntityTableComponent;
  parent: ScrubListComponent;

  columns = [
    { name: T('Pool'), prop: 'pool_name', always_display: true },
    { name: T('Threshold days'), prop: 'threshold' },
    { name: T('Description'), prop: 'description' },
    {
      name: T('Schedule'),
      prop: 'cron_schedule',
      widget: {
        icon: 'calendar-range',
        component: 'TaskScheduleListComponent',
      },
    },
    { name: T('Frequency'), prop: 'frequency', enableMatTooltip: true },
    { name: T('Next Run'), prop: 'next_run' },
    { name: T('Enabled'), prop: 'enabled' },
  ];
  rowIdentifier = 'id';
  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: T('Scrub Task'),
      key_props: ['pool_name'],
    },
  };

  constructor(
    protected taskService: TaskService,
    protected modalService: ModalService,
    protected translate: TranslateService,
  ) {}

  afterInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;
    this.modalService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      this.entityList.getData();
    });
  }

  resourceTransformIncomingRestData(data: ScrubTaskUi[]): ScrubTaskUi[] {
    return data.map((task) => {
      task.cron_schedule = `${task.schedule.minute} ${task.schedule.hour} ${task.schedule.dom} ${task.schedule.month} ${task.schedule.dow}`;
      task.frequency = this.taskService.getTaskCronDescription(task.cron_schedule);
      task.next_run = this.taskService.getTaskNextRun(task.cron_schedule);

      return task;
    });
  }

  doAdd(id?: number): void {
    this.modalService.openInSlideIn(ScrubFormComponent, id);
  }

  doEdit(id: number): void {
    this.doAdd(id);
  }
}
