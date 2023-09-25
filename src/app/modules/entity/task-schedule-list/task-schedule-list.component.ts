import {
  Component, Input, OnChanges, OnInit,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { TaskService } from 'app/services/task.service';

interface TaskScheduleRowConfig {
  schedule?: string;
  cron_schedule?: string;
  cron?: string;
  scrub_schedule?: string;
  enabled?: boolean;
}

@UntilDestroy()
@Component({
  selector: 'ix-task-schedule-list',
  templateUrl: './task-schedule-list.component.html',
})
export class TaskScheduleListComponent implements OnInit, OnChanges {
  private static readonly LIST_LENGTH = 5;
  @Input() value: string;
  @Input() config: TaskScheduleRowConfig;
  @Input() parent: EntityTableComponent;

  futureRuns: string[];

  constructor(private taskService: TaskService) {}

  ngOnChanges(): void {
    this.buildFutureRuns();
  }

  ngOnInit(): void {
    this.buildFutureRuns();
  }

  private buildFutureRuns(): void {
    if (this.config.enabled) {
      const scheduleExpression = this.config.cron_schedule
        || this.config.cron
        || this.config.scrub_schedule
        || this.config.schedule;

      this.futureRuns = this.getTaskNextRuns(scheduleExpression);
    }
  }

  private getTaskNextRuns(scheduleExpression: string): string[] {
    try {
      return this.taskService
        .getTaskNextRuns(scheduleExpression, TaskScheduleListComponent.LIST_LENGTH)
        .map((run) => run.toLocaleString());
    } catch (error: unknown) {
      console.error(error);
      return [];
    }
  }
}
