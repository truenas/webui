import {
  ChangeDetectionStrategy, Component, Input, OnChanges, TrackByFunction,
} from '@angular/core';
import { CronSchedulePreview } from 'app/modules/scheduler/classes/cron-schedule-preview/cron-schedule-preview';
import { LocaleService } from 'app/services/locale.service';

@Component({
  selector: 'ix-scheduler-date-examples',
  templateUrl: './scheduler-date-examples.component.html',
  styleUrls: ['./scheduler-date-examples.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchedulerDateExamplesComponent implements OnChanges {
  @Input() cronPreview: CronSchedulePreview;
  @Input() startDate: Date;

  constructor(
    private localeService: LocaleService,
  ) { }

  trackByIndex: TrackByFunction<number> = (index: number): number => index;
  scheduleExamples: Date[] = [];

  readonly maxExamples = 25;

  ngOnChanges(): void {
    this.scheduleExamples = this.cronPreview.listNextRunsInMonth(
      this.startDate,
      this.maxExamples + 1,
      this.localeService.timezone,
    );
  }
}
