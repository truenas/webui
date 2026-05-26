import { createComponentFactory, Spectator, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { IxDateComponent } from 'app/modules/dates/pipes/ix-date/ix-date.component';
import { LocaleService } from 'app/modules/language/locale.service';
import {
  CronSchedulePreview,
} from 'app/modules/scheduler/classes/cron-schedule-preview/cron-schedule-preview';
import { selectTimezone } from 'app/store/system-config/system-config.selectors';
import { SchedulerDateExamplesComponent } from './scheduler-date-examples.component';

describe('SchedulerDateExamplesComponent', () => {
  let spectator: Spectator<SchedulerDateExamplesComponent>;
  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const machineTimezone = 'America/New_York';
  const createComponent = createComponentFactory({
    component: SchedulerDateExamplesComponent,
    imports: [
      IxDateComponent,
    ],
    providers: [
      mockProvider(LocaleService, {
        timezone: machineTimezone,
        // Mirror the real LocaleService conversion so <ix-date> renders the
        // expected wall-clock when it delegates here.
        toMachineTime: (date: number | Date) => toZonedTime(
          fromZonedTime(date, browserTimezone),
          machineTimezone,
        ),
      }),
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
      FakeFormatDateTimePipe,
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

    const examples = spectator.queryAll('.date-spanner').map((element) => element.textContent!.trim());
    expect(examples).toEqual([
      '2022-02-23 00:00:00',
      '2022-02-24 00:00:00',
      '2022-02-25 00:00:00',
      '2022-02-26 00:00:00',
      '2022-02-27 00:00:00',
      '2022-02-28 00:00:00',
    ]);
  });

  it('shows a message when there are more examples', () => {
    spectator = createComponent({
      props: {
        cronPreview: new CronSchedulePreview({
          crontab: '* * * * *',
        }),
        startDate: new Date('2022-02-22 11:39:00'),
      },
    });

    expect(spectator.query('.only-first-results-message')).toExist();
  });
});
