import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { ScrubTaskUi } from 'app/interfaces/scrub-task.interface';
import { EntityFormService } from 'app/pages/common/entity/entity-form/services/entity-form.service';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table/entity-table.component';
import { EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { ScrubFormComponent } from 'app/pages/data-protection/scrub/scrub-form/scrub-form.component';
import { UserService, TaskService, SystemGeneralService } from 'app/services';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  selector: 'app-scrub-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
  providers: [TaskService, UserService, EntityFormService],
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
    protected modalService: ModalService,
    protected translate: TranslateService,
    protected systemGeneralService: SystemGeneralService,
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
      this.systemGeneralService.getGeneralConfig$.pipe(untilDestroyed(this)).subscribe((config) => {
        task.next_run = this.taskService.getTaskNextRun(task.cron_schedule, config.timezone);
      });

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
