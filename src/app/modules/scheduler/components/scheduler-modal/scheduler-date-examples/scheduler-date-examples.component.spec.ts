import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { FormatDateTimePipe } from 'app/core/pipes/format-datetime.pipe';
import {
  CronSchedulePreview,
} from 'app/modules/scheduler/classes/cron-schedule-preview/cron-schedule-preview';
import { selectTimezone } from 'app/store/system-config/system-config.selectors';
import { SchedulerDateExamplesComponent } from './scheduler-date-examples.component';

describe('SchedulerDateExamplesComponent', () => {
  let spectator: Spectator<SchedulerDateExamplesComponent>;
  const createComponent = createComponentFactory({
    component: SchedulerDateExamplesComponent,
    providers: [
      provideMockStore({
        selectors: [
          {
            selector: selectTimezone,
            value: 'America/New_York',
          },
        ],
      }),
    ],
    declarations: [
      FormatDateTimePipe,
    ],
  });

  it('shows list of examples of date times for the cron preview provided', () => {
    spectator = createComponent({
      props: {
        cronPreview: new CronSchedulePreview({
          crontab: '0 0 * * *',
        }),
        startDate: new Date('2022-02-22 11:39:00'),
      },
    });

    const examples = spectator.queryAll('.schedule-example').map((element) => element.textContent.trim());
    expect(examples).toEqual([
      '2022-02-23 00:00:00',
      '2022-02-24 00:00:00',
      '2022-02-25 00:00:00',
      '2022-02-26 00:00:00',
      '2022-02-27 00:00:00',
      '2022-02-28 00:00:00',
    ]);
  });

  it('shows a message when there are more examples ', () => {
    spectator = createComponent({
      props: {
        cronPreview: new CronSchedulePreview({
          crontab: '* * * * *',
        }),
        startDate: new Date('2022-02-22 11:39:00'),
      },
    });

    const examples = spectator.queryAll('.schedule-example').map((element) => element.textContent);
    expect(examples.length).toEqual(spectator.component.maxExamples);
    expect(spectator.query('.only-first-results-message')).toExist();
  });
});
