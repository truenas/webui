import { Component, Input, OnInit } from '@angular/core';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table';
import { TaskService } from 'app/services';

@Component({
  selector: 'app-task-schedule-list',
  template: `
    <mat-list>
      <mat-list-item *ngFor="let run of futureRuns">
        {{ run }}
      </mat-list-item>
    </mat-list>
  `
})
export class TaskScheduleListComponent implements OnInit {
  private static readonly LIST_LENGTH = 5;
  @Input() public config: { schedule?: string; cron_schedule?: string; cron?: string; scrub_schedule?: string };
  @Input() public parent: EntityTableComponent & { conf: any };

  public futureRuns: string[];

  constructor(private _taskService: TaskService) {}

  public ngOnInit(): void {
    const scheduleExpression =
      this.config.cron_schedule || this.config.cron || this.config.scrub_schedule || this.config.schedule;

    this.futureRuns = this._taskService
      .getTaskNextRuns(scheduleExpression, TaskScheduleListComponent.LIST_LENGTH)
      .map(run => run.toLocaleString());
  }
}
