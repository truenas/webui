import { TranslateService } from '@ngx-translate/core';
import { JobState } from 'app/enums/job-state.enum';
import { CloudSyncTask, CloudSyncTaskUi } from 'app/interfaces/cloud-sync-task.interface';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { TaskService } from 'app/services/task.service';

export class CloudSyncDataTransformer {
  static transformTask(
    task: CloudSyncTask,
    taskService: TaskService,
    translate: TranslateService,
  ): CloudSyncTaskUi {
    const formattedCronSchedule = scheduleToCrontab(task.schedule);

    // Create sort key for frequency sorting
    let frequencySortKey = '';
    if (task.schedule) {
      try {
        const hour = String(task.schedule.hour || '0');
        const minute = String(task.schedule.minute || '0');
        const dom = String(task.schedule.dom || '*');
        const month = String(task.schedule.month || '*');
        const dow = String(task.schedule.dow || '*');

        // Primary sort: frequency pattern (dom, month, dow)
        const frequencyKey = `${dom}|${month}|${dow}`;

        // Secondary sort: time (hour:minute)
        const timeKey = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;

        // Combine both for sorting: frequency first, then time
        frequencySortKey = `${frequencyKey}|${timeKey}`;
      } catch (error) {
        console.error('Schedule sorting error:', error, task.schedule);
        frequencySortKey = '';
      }
    }

    // Create transformed task with all required UI fields
    const nextRunTime = task.enabled ? taskService.getTaskNextTime(formattedCronSchedule) : null;
    const lastRunTime = task.job?.time_finished?.$date || null;

    // Calculate the relative time display for next_run
    let nextRunString = translate.instant('Disabled');
    if (task.enabled && nextRunTime && typeof nextRunTime !== 'string') {
      // Calculate relative time like "in 2 hours", "in 1 day", etc.
      const now = new Date();
      const diffMs = (nextRunTime as Date).getTime() - now.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMs < 0) {
        nextRunString = translate.instant('Overdue');
      } else if (diffMinutes < 60) {
        nextRunString = translate.instant('in {minutes} min.', { minutes: diffMinutes });
      } else if (diffHours < 24) {
        const remainingMinutes = diffMinutes % 60;
        if (remainingMinutes > 0) {
          nextRunString = translate.instant('in about {hours} hours', { hours: diffHours });
        } else {
          nextRunString = translate.instant('in {hours} hours', { hours: diffHours });
        }
      } else {
        nextRunString = translate.instant('in {days} days', { days: diffDays });
      }
    }

    // Create sort keys using timestamps
    const nextRunSortKey = nextRunTime ? (nextRunTime as Date).getTime().toString() : '0';
    let lastRunSortKey = '0';
    if (lastRunTime) {
      lastRunSortKey = typeof lastRunTime === 'number'
        ? lastRunTime.toString()
        : (lastRunTime as Date).getTime().toString();
    }

    const transformed = {
      ...task,
      credential: task.credentials.name,
      next_run: nextRunString,
      next_run_time: nextRunTime,
      next_run_sort_key: nextRunSortKey,
      last_run: lastRunTime?.toString() || '',
      last_run_sort_key: lastRunSortKey,
      frequency_sort_key: frequencySortKey,
      state: { state: JobState.Pending }, // Will be overridden below
    };

    // Set proper state
    if (task.job === null) {
      transformed.state = { state: transformed.locked ? JobState.Locked : JobState.Pending };
    } else {
      transformed.state = { state: task.job.state };
    }

    return transformed;
  }

  static transformTasks(
    tasks: CloudSyncTask[],
    taskService: TaskService,
    translate: TranslateService,
  ): CloudSyncTaskUi[] {
    return tasks.map((task) => this.transformTask(task, taskService, translate));
  }
}
