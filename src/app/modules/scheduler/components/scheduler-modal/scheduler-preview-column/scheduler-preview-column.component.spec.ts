import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatCalendarHarness } from '@angular/material/datepicker/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { format } from 'date-fns';
import { MockComponent } from 'ng-mocks';
import {
  SchedulerDateExamplesComponent,
} from 'app/modules/scheduler/components/scheduler-modal/scheduler-date-examples/scheduler-date-examples.component';
import { CrontabExplanationPipe } from 'app/modules/scheduler/pipes/crontab-explanation.pipe';
import { SchedulerPreviewColumnComponent } from './scheduler-preview-column.component';

describe('SchedulerPreviewColumnComponent', () => {
  let spectator: Spectator<SchedulerPreviewColumnComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: SchedulerPreviewColumnComponent,
    declarations: [
      MockComponent(SchedulerDateExamplesComponent),
      CrontabExplanationPipe,
    ],
  });

  beforeEach(() => {
    jest
      .useFakeTimers()
      .setSystemTime(new Date('2022-02-22 16:28:00'));

    spectator = createComponent({
      props: {
        crontab: '0 2 24-25 * mon',
        timezone: 'America/New_York',
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  async function getHighlightedCalendarDays(): Promise<string[]> {
    const calendar = await loader.getHarness(MatCalendarHarness);
    const highlightedCells = await calendar.getCells({ selector: '.highlighted-date' });
    return parallel(() => highlightedCells.map((cell) => cell.getText()));
  }

  it('shows crontab for the cron provided', () => {
    expect(spectator.query('.crontab')).toHaveExactText('0 2 24-25 * mon');
  });

  it('shows human friendly description of the schedule', () => {
    expect(spectator.query('.crontab-explanation'))
      .toHaveExactText('At 02:00 AM, between day 24 and 25 of the month, and on Monday');
  });

  it('shows calendar for current month with dates highlighted when task will be run', async () => {
    const highlightedDays = await getHighlightedCalendarDays();
    expect(highlightedDays).toEqual(['24', '25', '28']);
  });

  it('shows current system timezone', () => {
    const timezoneElement = spectator.query('.timezone-message');

    expect(timezoneElement).toHaveText('System Time Zone: America/New_York');
  });

  it('passes cron and time constraints to SchedulerDateExamplesComponent to show date examples', () => {
    const examplesComponent = spectator.query(SchedulerDateExamplesComponent);

    expect(format(examplesComponent.startDate, 'yyyy-MM-dd HH:mm:ss')).toEqual('2022-02-22 09:28:00');
  });

  it('shows calendar for next month with dates highlighted when next arrow is pressed', async () => {
    const calendar = await loader.getHarness(MatCalendarHarness);
    await calendar.next();

    const highlightedDays = await getHighlightedCalendarDays();
    const monthName = await calendar.getCurrentViewLabel();

    expect(highlightedDays).toEqual(['7', '14', '21', '24', '25', '28']);
    expect(monthName).toEqual('MAR 2022');
  });

  it('updates SchedulerDateExamplesComponent when next month is selected', async () => {
    const calendar = await loader.getHarness(MatCalendarHarness);
    await calendar.next();

    const examplesComponent = spectator.query(SchedulerDateExamplesComponent);
    expect(format(examplesComponent.startDate, 'yyyy-MM-dd HH:mm:ss')).toEqual('2022-03-01 00:00:00');
  });

  it('does not show any dates when user goes in the past', async () => {
    const calendar = await loader.getHarness(MatCalendarHarness);
    await calendar.previous();

    const examplesComponent = spectator.query(SchedulerDateExamplesComponent);
    expect(examplesComponent).not.toExist();

    const highlightedDays = await getHighlightedCalendarDays();
    expect(highlightedDays).toHaveLength(0);
  });
});
