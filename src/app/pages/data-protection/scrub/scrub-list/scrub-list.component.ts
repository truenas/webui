import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import * as cronParser from 'cron-parser';
import { Moment } from 'moment';

import { UserService, WebSocketService, TaskService } from 'app/services';
import { EntityFormService } from 'app/pages/common/entity/entity-form/services/entity-form.service';
import { ScrubFormComponent } from 'app/pages/data-protection/scrub/scrub-form/scrub-form.component';
import { ModalService } from 'app/services/modal.service';
import { T } from 'app/translate-marker';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table/entity-table.component';
import { InputTableConf } from 'app/pages/common/entity/entity-table/entity-table.component';

@Component({
  selector: 'app-scrub-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
  providers: [TaskService, UserService, EntityFormService],
})
export class ScrubListComponent implements InputTableConf, OnDestroy {
  public title = T('Scrub Tasks');
  public queryCall: string = 'pool.scrub.query';
  public wsDelete: string = 'pool.scrub.delete';
  public route_add: string[] = ['tasks', 'scrub', 'add'];
  public route_add_tooltip = 'Add Scrub Task';
  public route_edit: string[] = ['tasks', 'scrub', 'edit'];
  public entityList: EntityTableComponent;
  public parent: any;

  public columns: Array<any> = [
    { name: T('Pool'), prop: 'pool_name', always_display: true },
    { name: T('Threshold days'), prop: 'threshold' },
    { name: T('Description'), prop: 'description' },
    {
      name: T('Schedule'),
      prop: 'schedule',
      widget: {
        icon: 'calendar-range',
        component: 'TaskScheduleListComponent',
      },
    },
    { name: T('Next Run'), prop: 'scrub_next_run' },
    { name: T('Enabled'), prop: 'enabled' },
  ];
  public rowIdentifier = 'id';
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: T('Scrub Task'),
      key_props: ['pool_name'],
    },
  };
  private onModalClose: Subscription;

  constructor(
    protected router: Router,
    protected ws: WebSocketService,
    protected taskService: TaskService,
    protected modalService: ModalService,
    protected aroute: ActivatedRoute,
    protected userService: UserService,
    protected entityFormService: EntityFormService,
  ) {}

  afterInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;
    this.onModalClose = this.modalService.onClose$.subscribe(() => {
      this.entityList.getData();
    });
  }

  resourceTransformIncomingRestData(data: any[]): any {
    return data.map((task) => {
      task.schedule = `${task.schedule.minute} ${task.schedule.hour} ${task.schedule.dom} ${task.schedule.month} ${task.schedule.dow}`;

      /* Weird type assertions are due to a type definition error in the cron-parser library */
      task.scrub_next_run = ((cronParser.parseExpression(task.schedule, { iterator: true }).next() as unknown) as {
        value: { _date: Moment };
      }).value._date.fromNow();

      return task;
    });
  }

  doAdd(id?: number) {
    this.modalService.open('slide-in-form', new ScrubFormComponent(this.taskService, this.modalService), id);
  }

  doEdit(id: number) {
    this.doAdd(id);
  }

  ngOnDestroy(): void {
    this.onModalClose?.unsubscribe();
  }
}
