import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { slice } from 'lodash-es';
import { CronSchedulePreview } from 'app/modules/scheduler/classes/cron-schedule-preview/cron-schedule-preview';
import { LocaleService } from 'app/services/locale.service';

@Component({
  selector: 'ix-scheduler-date-examples',
  templateUrl: './scheduler-date-examples.component.html',
  styleUrls: ['./scheduler-date-examples.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchedulerDateExamplesComponent {
  readonly cronPreview = input.required<CronSchedulePreview>();
  readonly startDate = input.required<Date>();

  constructor(
    private localeService: LocaleService,
  ) { }

  protected readonly maxExamples = 25;

  protected readonly scheduleExamples = computed(() => {
    return this.cronPreview().listNextRunsInMonth(
      this.startDate(),
      this.maxExamples + 1,
      this.localeService.timezone,
    );
  });
  protected readonly slice = slice;
}
