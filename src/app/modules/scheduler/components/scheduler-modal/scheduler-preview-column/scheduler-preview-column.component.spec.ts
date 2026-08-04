import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnCalendarHarness, TnIconButtonHarness } from '@truenas/ui-components';
import { parse } from 'date-fns';
import { MockComponent } from 'ng-mocks';
import { LanguageService } from 'app/modules/language/language.service';
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
    providers: [
      mockProvider(LanguageService, {
        currentLanguage: 'en',
      }),
    ],
  });

  beforeEach(() => {
    // TODO: Not sure why doNotFake is needed. Try removing after some Angular/Material upgrades.
    jest.useFakeTimers({
      doNotFake: ['queueMicrotask'],
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  /**
   * The clock has to be set before the component is created — the preview reads "now" as it
   * builds its signal graph — so creation lives here rather than in `beforeEach`.
   */
  function setup(options: { crontab?: string; timezone?: string; now?: string } = {}): void {
    const {
      crontab = '0 2 24-25 * mon',
      timezone = 'America/New_York',
      now = '2022-02-22 16:28:00',
    } = options;

    jest.setSystemTime(new Date(now));

    spectator = createComponent({ props: { crontab, timezone } });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  }

  async function getHighlightedCalendarDays(): Promise<string[]> {
    const calendar = await loader.getHarness(TnCalendarHarness);
    const highlightedCells = await calendar.getCells({ marked: true });
    return parallel(() => highlightedCells.map((cell) => cell.getText()));
  }

  it('shows crontab for the cron provided', () => {
    setup();

    expect(spectator.query('.crontab')).toHaveExactText('0 2 24-25 * mon');
  });

  it('shows human friendly description of the schedule', () => {
    setup();

    expect(spectator.query('.crontab-explanation'))
      .toHaveExactText('At 02:00 (02:00 AM), between day 24 and 25 of the month, and on Monday');
  });

  it('shows calendar for current month with dates highlighted when task will be run', async () => {
    setup();

    const highlightedDays = await getHighlightedCalendarDays();
    expect(highlightedDays).toEqual(['24', '25', '28']);
  });

  // Near a month boundary the browser and the configured system time zone disagree about
  // which month "now" is in — Kiev has already rolled over to March here while New York is
  // still in February. The calendar shows the browser's month, so that is where the marks
  // have to land; counting from the system time zone would put them in a month off screen.
  it('marks days in the month on screen when the system timezone is in another month', async () => {
    setup({ now: '2022-03-01 00:30:00' });

    const calendar = await loader.getHarness(TnCalendarHarness);

    expect(await calendar.getCurrentViewLabel()).toBe('MAR 2022');
    expect(await getHighlightedCalendarDays()).toEqual(['7', '14', '21', '24', '25', '28']);
  });

  // The mirror of the case above, with the clocks the other way round: Kiritimati has
  // already rolled over to March while the browser is still on the last evening of
  // February. February is the month on screen, so the preview counts from now — rewinding
  // to the 1st instead would mark every day of a month that is all but over.
  it('marks only days still to come when the system timezone is a month ahead', async () => {
    setup({
      crontab: '30 23 * * *',
      timezone: 'Pacific/Kiritimati',
      now: '2022-02-28 23:00:00',
    });

    const calendar = await loader.getHarness(TnCalendarHarness);

    expect(await calendar.getCurrentViewLabel()).toBe('FEB 2022');
    expect(await getHighlightedCalendarDays()).toEqual(['28']);
  });

  it('asks to be closed when the close button is clicked', async () => {
    setup();
    const closeRequested = jest.fn();
    spectator.output('closeRequested').subscribe(closeRequested);

    const closeButton = await loader.getHarness(TnIconButtonHarness.with({ name: 'close' }));
    await closeButton.click();

    expect(closeRequested).toHaveBeenCalled();
  });

  it('shows current system timezone', () => {
    setup();

    const timezoneElement = spectator.query('.timezone-message');

    expect(timezoneElement).toHaveText('System Time Zone: America/New_York');
  });

  it('passes cron and time constraints to SchedulerDateExamplesComponent to show date examples', () => {
    setup();

    const examplesComponent = spectator.query(SchedulerDateExamplesComponent)!;

    expect(examplesComponent.startDate).toEqual(parse('2022-02-22 09:28:00', 'yyyy-MM-dd HH:mm:ss', new Date()));
  });

  it('shows calendar for next month with dates highlighted when next arrow is pressed', async () => {
    setup();

    const calendar = await loader.getHarness(TnCalendarHarness);
    await calendar.next();

    const highlightedDays = await getHighlightedCalendarDays();
    const monthName = await calendar.getCurrentViewLabel();

    expect(highlightedDays).toEqual(['7', '14', '21', '24', '25', '28']);
    expect(monthName).toBe('MAR 2022');
  });

  it('updates SchedulerDateExamplesComponent when next month is selected', async () => {
    setup();

    const calendar = await loader.getHarness(TnCalendarHarness);
    await calendar.next();

    const examplesComponent = spectator.query(SchedulerDateExamplesComponent)!;
    expect(examplesComponent.startDate).toEqual(parse('2022-03-01 00:00:00', 'yyyy-MM-dd HH:mm:ss', new Date()));
  });

  it('does not show any dates when user goes in the past', async () => {
    setup();

    const calendar = await loader.getHarness(TnCalendarHarness);
    await calendar.previous();

    const examplesComponent = spectator.query(SchedulerDateExamplesComponent);
    expect(examplesComponent).not.toExist();

    const highlightedDays = await getHighlightedCalendarDays();
    expect(highlightedDays).toHaveLength(0);
  });
});
