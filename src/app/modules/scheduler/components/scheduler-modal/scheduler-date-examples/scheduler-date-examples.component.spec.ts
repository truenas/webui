import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { utcToZonedTime } from 'date-fns-tz';
import { MockPipe } from 'ng-mocks';
import { FormatDateTimePipe } from 'app/core/pipes/format-datetime.pipe';
import {
  CronSchedulePreview,
} from 'app/modules/scheduler/classes/cron-schedule-preview/cron-schedule-preview';
import { SchedulerDateExamplesComponent } from './scheduler-date-examples.component';

describe('SchedulerDateExamplesComponent', () => {
  let spectator: Spectator<SchedulerDateExamplesComponent>;
  const createComponent = createComponentFactory({
    component: SchedulerDateExamplesComponent,
    declarations: [
      MockPipe(FormatDateTimePipe, (date: Date) => {
        return utcToZonedTime(date, 'America/New_York').toISOString();
      }),
    ],
  });

  it('shows list of examples of date times for the cron preview provided', () => {
    spectator = createComponent({
      props: {
        cronPreview: new CronSchedulePreview({
          crontab: '0 0 * * *',
          timezone: 'America/New_York',
        }),
        zonedStartDate: '2022-02-22 11:39:00',
      },
    });

    const examples = spectator.queryAll('.schedule-example').map((element) => element.textContent);
    expect(examples).toEqual([
      '2022-02-23T00:00:00.000Z',
      '2022-02-24T00:00:00.000Z',
      '2022-02-25T00:00:00.000Z',
      '2022-02-26T00:00:00.000Z',
      '2022-02-27T00:00:00.000Z',
      '2022-02-28T00:00:00.000Z',
    ]);
  });

  it('shows a message when there are more examples ', () => {
    spectator = createComponent({
      props: {
        cronPreview: new CronSchedulePreview({
          crontab: '* * * * *',
          timezone: 'America/New_York',
        }),
        zonedStartDate: '2022-02-22 11:39:00',
      },
    });

    const examples = spectator.queryAll('.schedule-example').map((element) => element.textContent);
    expect(examples.length).toEqual(spectator.component.maxExamples);
    expect(spectator.query('.only-first-results-message')).toExist();
  });
});
